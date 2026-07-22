output "repository_urls" {
  description = "Map of service name → ECR repository URL"
  value = {
    for name, repo in aws_ecr_repository.services : name => repo.repository_url
  }
}

output "repository_arns" {
  description = "Map of service name → ECR repository ARN"
  value = {
    for name, repo in aws_ecr_repository.services : name => repo.arn
  }
}

output "registry_id" {
  description = "AWS account ID that owns the registry"
  value       = values(aws_ecr_repository.services)[0].registry_id
}
