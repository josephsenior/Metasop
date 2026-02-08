import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class DeploymentGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Generate deployment guide
   */
  generateDeploymentGuide(): string {
    const content = getArtifactContent(this.diagram, "devops_infrastructure")
    return stringifyArtifact(content)
  }

  private generateAWSDeployment(): string {
    return `1. **EC2 Deployment**
   - Launch EC2 instance (Ubuntu 22.04)
   - Install Node.js and PM2
   - Clone repository
   - Configure environment variables
   - Run: \`pm2 start npm --name "app" -- start\`

2. **ECS Deployment**
   - Push Docker image to ECR
   - Create ECS task definition
   - Create ECS service
   - Configure load balancer

3. **Elastic Beanstalk**
   - Install EB CLI
   - Run: \`eb init\`
   - Run: \`eb create\`
   - Configure environment variables`
  }
}

