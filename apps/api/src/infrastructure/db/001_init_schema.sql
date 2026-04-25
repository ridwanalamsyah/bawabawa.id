CREATE TABLE branches (
  id UUID PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  branch_id UUID REFERENCES branches(id),
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  division VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  code VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  code VARCHAR(120) UNIQUE NOT NULL,
  action VARCHAR(40) NOT NULL
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(30)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(30),
  branch_id UUID REFERENCES branches(id)
);

CREATE TABLE products (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  sku VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
  current_stock INTEGER NOT NULL CHECK (current_stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  branch_id UUID REFERENCES branches(id),
  customer_id UUID REFERENCES customers(id),
  order_number VARCHAR(60) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
  idempotency_key VARCHAR(120) UNIQUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  method VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  paid_at TIMESTAMPTZ
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  invoice_number VARCHAR(60) UNIQUE NOT NULL,
  status VARCHAR(30) NOT NULL,
  issued_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  branch_id UUID REFERENCES branches(id),
  status VARCHAR(30) NOT NULL,
  total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0)
);

CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  branch_id UUID REFERENCES branches(id),
  movement_type VARCHAR(30) NOT NULL,
  qty_before INTEGER NOT NULL,
  qty_change INTEGER NOT NULL,
  qty_after INTEGER NOT NULL CHECK (qty_after >= 0),
  reference_type VARCHAR(40),
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  from_branch_id UUID REFERENCES branches(id),
  to_branch_id UUID REFERENCES branches(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  status VARCHAR(20) NOT NULL
);

CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY,
  branch_id UUID REFERENCES branches(id),
  source_type VARCHAR(30) NOT NULL,
  source_id UUID,
  direction VARCHAR(10) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY,
  report_type VARCHAR(40) NOT NULL,
  generated_by UUID REFERENCES users(id),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE approval_requests (
  id UUID PRIMARY KEY,
  module_name VARCHAR(40) NOT NULL,
  entity_id UUID NOT NULL,
  level_required INTEGER NOT NULL CHECK (level_required > 0),
  current_level INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL,
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  action VARCHAR(60) NOT NULL,
  module_name VARCHAR(40) NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wa_message_logs (
  id UUID PRIMARY KEY,
  template_code VARCHAR(80) NOT NULL,
  recipient_phone VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  provider_message_id VARCHAR(120),
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_branch_status_created ON orders(branch_id, status, created_at DESC);
CREATE INDEX idx_inventory_logs_product_created ON inventory_logs(product_id, created_at DESC);
CREATE INDEX idx_financial_transactions_branch_posted ON financial_transactions(branch_id, posted_at DESC);
CREATE INDEX idx_audit_logs_actor_created ON audit_logs(actor_id, created_at DESC);
