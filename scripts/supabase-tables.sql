-- Transaction History Table for RiteForge
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(66) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('token_create', 'stream_create', 'lock_create', 'vesting_create', 'nft_deploy', 'launchpad_create', 'airdrop', 'dvp_swap', 'record')),
  type_id VARCHAR(100),
  token_address VARCHAR(66),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount VARCHAR(100),
  recipient VARCHAR(66),
  tx_hash VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  chain_id INTEGER DEFAULT 1979,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_tx_history_user ON transaction_history(user_address);
CREATE INDEX IF NOT EXISTS idx_tx_history_type ON transaction_history(type);
CREATE INDEX IF NOT EXISTS idx_tx_history_created ON transaction_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_history_status ON transaction_history(status);

-- Enable RLS
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON transaction_history
  FOR SELECT USING (auth.uid()::text = user_address);

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transaction_history
  FOR INSERT WITH CHECK (auth.uid()::text = user_address);

-- Policy: Users can update their own transactions
CREATE POLICY "Users can update own transactions" ON transaction_history
  FOR UPDATE USING (auth.uid()::text = user_address);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON transaction_history TO authenticated;
