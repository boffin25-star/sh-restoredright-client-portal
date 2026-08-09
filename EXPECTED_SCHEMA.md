# Existing Supabase backend expected by this client portal

This new repository is a frontend replacement and is designed to continue using the existing S&H Supabase project.

The frontend expects these tables/views or fields to already exist:

- `jobs`
  - `id`, `customer_email`, `customer_name`, `address`, `job_type`, `workflow_stage`
  - `claim_number`, `adjuster_name`, `adjuster_phone`, `adjuster_email`
  - `change_orders`
  - `deposit_amount`, `deposit_paid`, `final_amount`, `final_paid`
  - `created_at`, `updated_at`
- `client_portal_meta`
  - `email`, `visible_tabs`, `must_reset`, `invited_at`, `invited_by`, `password_set_at`
- `job_messages`
  - `id`, `job_id`, `sender_name`, `sender_role`, `message`, `created_at`
- `documents`
  - `id`, `linked_job_id`, `doc_type`, `name`, `description`, `url`, `amount`, `uploaded_at`
- `work_authorizations`
  - `job_id`, `auth_code`, `wizard_mode`, `status`, `created_at`

RPCs expected:
- `client_respond_to_change_order`
- `client_update_contact_info`
- `client_sign_work_authorization`

Authentication:
- Supabase Auth email/password
- Supabase Auth email OTP/magic-link fallback

No database migration is included in this package because the existing staging portal already uses these backend objects.
