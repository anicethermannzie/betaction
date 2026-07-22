output "db_endpoint" {
  description = "RDS instance endpoint (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "db_host" {
  description = "RDS hostname only (without port)"
  value       = aws_db_instance.main.address
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "db_username" {
  description = "Database master username"
  value       = aws_db_instance.main.username
}

output "db_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}
