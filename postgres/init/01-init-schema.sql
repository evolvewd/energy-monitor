-- Schema per Energy Monitor Settings
-- Questo database contiene solo configurazioni, non dati time-series

-- Tabella per le impostazioni di sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per gli alloggi
CREATE TABLE IF NOT EXISTS alloggi (
    id SERIAL PRIMARY KEY,
    alloggio_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    topic_prefix VARCHAR(255),
    modbus_address INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per i lettori Modbus
CREATE TABLE IF NOT EXISTS modbus_readers (
    id SERIAL PRIMARY KEY,
    reader_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('parti_comuni', 'produzione', 'accumulo_ac', 'accumulo_dc', 'alloggio')),
    name VARCHAR(255) NOT NULL,
    modbus_address INTEGER NOT NULL CHECK (modbus_address >= 1 AND modbus_address <= 247),
    model VARCHAR(10) NOT NULL DEFAULT '6m' CHECK (model IN ('6m', '7m')),
    alloggio_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alloggio_id) REFERENCES alloggi(alloggio_id) ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_alloggi_alloggio_id ON alloggi(alloggio_id);
CREATE INDEX IF NOT EXISTS idx_modbus_readers_reader_id ON modbus_readers(reader_id);
CREATE INDEX IF NOT EXISTS idx_modbus_readers_type ON modbus_readers(type);
CREATE INDEX IF NOT EXISTS idx_modbus_readers_alloggio_id ON modbus_readers(alloggio_id);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alloggi_updated_at BEFORE UPDATE ON alloggi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modbus_readers_updated_at BEFORE UPDATE ON modbus_readers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

