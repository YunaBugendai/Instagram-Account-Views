-- iOS App Attest için kayıtlı cihaz anahtarları.
-- Android tarafı stateless (her istekte taze Play Integrity token'ı doğrulanır), bu yüzden burada yok.
CREATE TABLE IF NOT EXISTS attested_devices (
  device_id TEXT PRIMARY KEY,
  key_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  sign_count BIGINT NOT NULL DEFAULT 0,
  bundle_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ödül reklamı sonucu verilen her bonus hakkın denetim kaydı (abuse analizi ve destek talepleri için).
CREATE TABLE IF NOT EXISTS reward_grants (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  ad_unit TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_grants_device_id ON reward_grants (device_id);
