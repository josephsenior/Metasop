# Test diagram generation
$body = @{
    prompt = "Build a simple todo app with authentication and task categories"
} | ConvertTo-Json

try {
    Write-Host "Testing diagram generation..." -ForegroundColor Cyan
    Write-Host ""
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/diagrams/generate" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Response received!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Status: $($response.status)" -ForegroundColor Yellow
    
    if ($response.data.diagram) {
        Write-Host "Nodes: $($response.data.diagram.nodes.Count)" -ForegroundColor Green
        Write-Host "Edges: $($response.data.diagram.edges.Count)" -ForegroundColor Green
        Write-Host ""
        Write-Host "First node:" -ForegroundColor Cyan
        $response.data.diagram.nodes[0] | ConvertTo-Json -Depth 3
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

