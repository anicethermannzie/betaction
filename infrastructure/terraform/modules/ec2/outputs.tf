output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.main.id
}

output "public_ip" {
  description = "Public IP address assigned by AWS (changes on stop/start)"
  value       = aws_instance.main.public_ip
}

output "elastic_ip" {
  description = "Elastic IP address — static, use this for DNS"
  value       = aws_eip.main.public_ip
}

output "private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.main.private_ip
}

output "iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}
