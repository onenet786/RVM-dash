IF DB_ID('RVMDB') IS NULL
    CREATE DATABASE RVMDB;
GO

USE RVMDB;
GO

IF OBJECT_ID('dbo.PointSettings', 'U') IS NULL
CREATE TABLE dbo.PointSettings
(
    PointSettingID INT IDENTITY PRIMARY KEY,
    BottleSize VARCHAR(20),
    MaterialType VARCHAR(20),
    Points INT,
    IsActive BIT DEFAULT 1
);

IF OBJECT_ID('dbo.BottleTransactions', 'U') IS NULL
CREATE TABLE dbo.BottleTransactions
(
    TransactionID INT IDENTITY PRIMARY KEY,
    SessionID UNIQUEIDENTIFIER NULL,
    TransactionDate DATETIME DEFAULT GETDATE(),
    BottleSize VARCHAR(20),
    MaterialType VARCHAR(20),
    PointsAwarded INT,
    MobileNumber VARCHAR(20) NULL,
    IsAccepted BIT,
    MachineName VARCHAR(50) DEFAULT 'ONS-RVM-1000'
);

IF COL_LENGTH('dbo.BottleTransactions', 'SessionID') IS NULL
    ALTER TABLE dbo.BottleTransactions ADD SessionID UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.BottleTransactions', 'MobileNumber') IS NULL
    ALTER TABLE dbo.BottleTransactions ADD MobileNumber VARCHAR(20) NULL;

IF OBJECT_ID('dbo.WalletAccounts', 'U') IS NULL
CREATE TABLE dbo.WalletAccounts
(
    PhoneNumber VARCHAR(20) PRIMARY KEY,
    PointsBalance INT NOT NULL DEFAULT 0,
    LastUpdated DATETIME NOT NULL DEFAULT GETDATE()
);

IF OBJECT_ID('dbo.WalletTransactions', 'U') IS NULL
CREATE TABLE dbo.WalletTransactions
(
    WalletTransactionID INT IDENTITY PRIMARY KEY,
    TransactionDate DATETIME NOT NULL DEFAULT GETDATE(),
    PhoneNumber VARCHAR(20) NOT NULL,
    PointsCredited INT NOT NULL,
    CONSTRAINT FK_WalletTransactions_WalletAccounts
        FOREIGN KEY (PhoneNumber) REFERENCES dbo.WalletAccounts(PhoneNumber)
);

IF NOT EXISTS (SELECT 1 FROM dbo.PointSettings)
INSERT INTO dbo.PointSettings (BottleSize, MaterialType, Points)
VALUES
    ('SMALL', 'PLASTIC', 5),
    ('MEDIUM', 'PLASTIC', 10),
    ('LARGE', 'PLASTIC', 15),
    ('SMALL', 'METAL', 5),
    ('MEDIUM', 'METAL', 10),
    ('LARGE', 'METAL', 15),
    ('SMALL', 'CAN', 5), ('MEDIUM', 'CAN', 10), ('LARGE', 'CAN', 15),
    ('SMALL', 'GLASS', 5), ('MEDIUM', 'GLASS', 10), ('LARGE', 'GLASS', 15),
    ('SMALL', 'TETRA', 5), ('MEDIUM', 'TETRA', 10), ('LARGE', 'TETRA', 15);
GO

MERGE dbo.PointSettings AS target
USING (VALUES
    ('SMALL', 'CAN', 5), ('MEDIUM', 'CAN', 10), ('LARGE', 'CAN', 15),
    ('SMALL', 'PLASTIC', 5), ('MEDIUM', 'PLASTIC', 10), ('LARGE', 'PLASTIC', 15),
    ('SMALL', 'GLASS', 5), ('MEDIUM', 'GLASS', 10), ('LARGE', 'GLASS', 15),
    ('SMALL', 'TETRA', 5), ('MEDIUM', 'TETRA', 10), ('LARGE', 'TETRA', 15)
) AS source (BottleSize, MaterialType, Points)
ON target.BottleSize = source.BottleSize AND target.MaterialType = source.MaterialType
WHEN NOT MATCHED THEN
    INSERT (BottleSize, MaterialType, Points) VALUES (source.BottleSize, source.MaterialType, source.Points);
GO

-- Apply metal-can defaults for databases created by an older version.
UPDATE dbo.PointSettings
SET Points = CASE BottleSize WHEN 'SMALL' THEN 5 WHEN 'MEDIUM' THEN 10 WHEN 'LARGE' THEN 15 END
WHERE MaterialType = 'METAL' AND BottleSize IN ('SMALL', 'MEDIUM', 'LARGE') AND Points = 0;
GO

CREATE OR ALTER PROCEDURE dbo.RVM_sp_GetPoints
    @BottleSize VARCHAR(20),
    @MaterialType VARCHAR(20)
AS
    SELECT TOP 1 Points
    FROM dbo.PointSettings
    WHERE BottleSize = @BottleSize
      AND MaterialType = @MaterialType
      AND IsActive = 1;
GO

CREATE OR ALTER PROCEDURE dbo.RVM_sp_SaveTransaction
    @SessionID UNIQUEIDENTIFIER,
    @BottleSize VARCHAR(20),
    @MaterialType VARCHAR(20),
    @PointsAwarded INT,
    @IsAccepted BIT
AS
    INSERT INTO dbo.BottleTransactions
        (SessionID, BottleSize, MaterialType, PointsAwarded, IsAccepted, MachineName)
    VALUES
        (@SessionID, @BottleSize, @MaterialType, @PointsAwarded, @IsAccepted, 'ONS-RVM-1000');
GO

CREATE OR ALTER PROCEDURE dbo.RVM_sp_CreditWallet
    @PhoneNumber VARCHAR(20),
    @Points INT,
    @SessionID UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM dbo.WalletAccounts WHERE PhoneNumber = @PhoneNumber)
        INSERT INTO dbo.WalletAccounts (PhoneNumber, PointsBalance) VALUES (@PhoneNumber, 0);

    UPDATE dbo.WalletAccounts
    SET PointsBalance = PointsBalance + @Points,
        LastUpdated = GETDATE()
    WHERE PhoneNumber = @PhoneNumber;

    INSERT INTO dbo.WalletTransactions (PhoneNumber, PointsCredited)
    VALUES (@PhoneNumber, @Points);

    UPDATE dbo.BottleTransactions
    SET MobileNumber = @PhoneNumber
    WHERE SessionID = @SessionID;

    COMMIT TRANSACTION;
END;
GO
