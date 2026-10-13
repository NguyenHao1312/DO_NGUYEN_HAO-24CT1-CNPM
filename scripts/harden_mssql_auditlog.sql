-- =====================================================================
-- KỊCH BẢN BẢO VỆ DATABASE MICROSOFT SQL SERVER CHO HỆ THỐNG UNIMS
-- Nhiệm vụ:
-- 1. Kích hoạt tính chất Bất biến (WORM - Write Once Read Many) cho AuditLog
-- 2. Ngăn chặn triệt để hành vi xóa/sửa dấu vết tấn công
-- 3. Tạo View và Procedure hỗ trợ Admin điều tra mốc thời gian tấn công
-- =====================================================================

USE [unims_db];
GO

-- 1. TRIGGER CHỐNG XÓA VÀ SỬA LOG (ANTI-TAMPERING TRIGGER)
IF OBJECT_ID('trg_PreventAuditLogTamper', 'TR') IS NOT NULL
    DROP TRIGGER trg_PreventAuditLogTamper;
GO

CREATE TRIGGER trg_PreventAuditLogTamper
ON student_management_auditlog
FOR UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Nếu có người cố ý thực hiện UPDATE hoặc DELETE trên bảng này
    IF EXISTS (SELECT * FROM deleted)
    BEGIN
        RAISERROR (
            N'CẢNH BÁO BẢO MẬT: Bảng student_management_auditlog tuân thủ nguyên tắc WORM (Write Once, Read Many). Mọi hành vi cập nhật hoặc xóa dữ liệu nhật ký kiểm toán đều bị cấm triệt để!',
            16, 
            1
        );
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO

-- 2. TẠO VIEW TRUY VẾT MỐC THỜI GIAN BẤT THƯỜNG (HOURLY ATTACK TIMELINE VIEW)
IF OBJECT_ID('vw_AttackTimelineAnalysis', 'V') IS NOT NULL
    DROP VIEW vw_AttackTimelineAnalysis;
GO

CREATE VIEW vw_AttackTimelineAnalysis AS
SELECT 
    DATEADD(minute, DATEDIFF(minute, 0, timestamp), 0) AS TimeWindow,
    COUNT(*) AS TotalRequests,
    SUM(CASE WHEN is_suspicious = 1 THEN 1 ELSE 0 END) AS SuspiciousCount,
    SUM(CASE WHEN status_code = 401 THEN 1 ELSE 0 END) AS Unauthorized_401,
    SUM(CASE WHEN status_code = 403 THEN 1 ELSE 0 END) AS Forbidden_403,
    SUM(CASE WHEN status_code = 404 THEN 1 ELSE 0 END) AS NotFound_404,
    SUM(CASE WHEN status_code = 429 THEN 1 ELSE 0 END) AS RateLimited_429,
    SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) AS ServerError_500,
    COUNT(DISTINCT ip_address) AS UniqueIPCount,
    AVG(execution_time_ms) AS AvgLatencyMs
FROM student_management_auditlog
GROUP BY DATEADD(minute, DATEDIFF(minute, 0, timestamp), 0);
GO

-- 3. STORED PROCEDURE PHÁT HIỆN ĐỈNH NHỌN TẤN CÔNG (SP_DETECT_ATTACK_SPIKES)
IF OBJECT_ID('sp_DetectAttackSpikes', 'P') IS NOT NULL
    DROP PROCEDURE sp_DetectAttackSpikes;
GO

CREATE PROCEDURE sp_DetectAttackSpikes
    @Threshold INT = 30,          -- Số request/phút tối thiểu để tính là đột biến
    @LookbackHours INT = 24       -- Số giờ nhìn lại
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 50
        TimeWindow,
        TotalRequests,
        SuspiciousCount,
        Unauthorized_401,
        Forbidden_403,
        RateLimited_429,
        ServerError_500,
        UniqueIPCount,
        AvgLatencyMs,
        CASE 
            WHEN RateLimited_429 > 10 THEN N'DDoS / Brute-Force Bị Chặn'
            WHEN Unauthorized_401 > 20 THEN N'Tấn công Dò Mật Khẩu (Brute-Force)'
            WHEN Forbidden_403 > 15 THEN N'Cố ý Leo Quyền / Dò Quét Admin'
            WHEN TotalRequests > 100 THEN N'Nghi vấn HTTP Flood / DoS'
            ELSE N'Bất Thường Nhẹ'
        END AS IncidentType
    FROM vw_AttackTimelineAnalysis
    WHERE TimeWindow >= DATEADD(hour, -@LookbackHours, GETDATE())
      AND TotalRequests >= @Threshold
    ORDER BY TotalRequests DESC, SuspiciousCount DESC;
END;
GO
