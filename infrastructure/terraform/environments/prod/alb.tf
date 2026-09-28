# TLS terminates at the ALB; EC2 accepts traffic only from its security group.
resource "aws_lb" "app" {
  name               = "${var.project}-app-${var.environment}"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [module.security_groups.alb_sg_id]
  subnets            = module.vpc.public_subnet_ids
  tags               = local.common_tags
}

resource "aws_lb_target_group" "app" {
  for_each    = { frontend = 3000, api = 80 }
  name_prefix = each.key == "frontend" ? "web-" : "api-"
  port        = each.value
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  health_check {
    path    = each.key == "frontend" ? "/" : "/health"
    matcher = "200"
  }
  tags = local.common_tags
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group_attachment" "app" {
  for_each         = aws_lb_target_group.app
  target_group_arn = each.value.arn
  target_id        = module.ec2.instance_id
  port             = each.value.port
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = module.route53_acm.certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app["frontend"].arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app["api"].arn
  }
  condition {
    host_header {
      values = ["api.${var.domain_name}"]
    }
  }
}

resource "aws_lb_listener_rule" "gateway_paths" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 20
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app["api"].arn
  }
  condition {
    path_pattern {
      values = ["/socket.io*", "/api/matches*", "/api/predictions*", "/api/notifications*"]
    }
  }
}
