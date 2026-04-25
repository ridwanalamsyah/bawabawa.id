CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  division VARCHAR(50) NOT NULL,
  branch_id UUID REFERENCES branches(id),
  permissions JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_steps (
  id UUID PRIMARY KEY,
  approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_level INTEGER NOT NULL CHECK (step_level > 0),
  approver_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL,
  note TEXT,
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  name VARCHAR(160) NOT NULL,
  stage VARCHAR(30) NOT NULL,
  owner_id UUID REFERENCES users(id),
  expected_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  employee_code VARCHAR(40) UNIQUE NOT NULL,
  position_title VARCHAR(120) NOT NULL,
  salary_base NUMERIC(14, 2) NOT NULL DEFAULT 0,
  joined_at DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  UNIQUE (employee_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2000),
  status VARCHAR(20) NOT NULL,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ
);
