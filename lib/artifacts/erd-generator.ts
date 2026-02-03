import type { Diagram } from "@/types/diagram"

export class ERDGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Generate ERD in Mermaid format
   */
  generateMermaidERD(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const schema = archContent.database_schema || {}
    const tables = schema.tables || []
    const tablesArray = Array.isArray(tables) ? tables : []

    if (tablesArray.length === 0) {
      return `erDiagram
    NO_TABLES {
        string message "No database schema found"
    }
`
    }

    let mermaid = "erDiagram\n\n"

    // Generate tables
    tablesArray.forEach((table: any) => {
      const tableName = table.table_name || table.name || "Table"
      mermaid += `    ${tableName} {\n`

      if (table.columns) {
        const columns = Array.isArray(table.columns) ? table.columns : []
        columns.forEach((col: any, idx: number) => {
          const colName = typeof col === "object" ? col.name : col
          const colType = typeof col === "object" ? col.type || "VARCHAR" : "VARCHAR"
          const constraints = typeof col === "object" && col.constraints
            ? (Array.isArray(col.constraints) ? col.constraints : [col.constraints])
            : []

          const isPrimaryKey = constraints.includes("PRIMARY KEY") || idx === 0
          const isForeignKey = constraints.some((c: string) => c.includes("FOREIGN KEY") || c.includes("FK"))
          const isUnique = constraints.includes("UNIQUE")
          const isNotNull = constraints.includes("NOT NULL") || isPrimaryKey

          let typeStr = this.normalizeTypeForMermaid(colType)
          if (isPrimaryKey) typeStr += " PK"
          if (isForeignKey) typeStr += " FK"
          if (isUnique) typeStr += " UK"
          if (!isNotNull) typeStr += " \"nullable\""

          mermaid += `        ${typeStr} ${colName}\n`
        })
      }

      mermaid += `    }\n\n`
    })

    return mermaid
  }

  /**
   * Generate ERD in PlantUML format
   */
  generatePlantUMLERD(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const schema = archContent.database_schema || {}
    const tables = schema.tables || []
    const tablesArray = Array.isArray(tables) ? tables : []

    if (tablesArray.length === 0) {
      return `@startuml
entity "NO_TABLES" {
  * message : string
}
@enduml
`
    }

    let plantuml = "@startuml\n\n"

    // Generate entities
    tablesArray.forEach((table: any) => {
      const tableName = table.table_name || table.name || "Table"
      plantuml += `entity "${tableName}" {\n`

      if (table.columns) {
        const columns = Array.isArray(table.columns) ? table.columns : []
        columns.forEach((col: any, idx: number) => {
          const colName = typeof col === "object" ? col.name : col
          const colType = typeof col === "object" ? col.type || "VARCHAR" : "VARCHAR"
          const constraints = typeof col === "object" && col.constraints
            ? (Array.isArray(col.constraints) ? col.constraints : [col.constraints])
            : []

          const isPrimaryKey = constraints.includes("PRIMARY KEY") || idx === 0
          const prefix = isPrimaryKey ? "* " : ""

          plantuml += `  ${prefix}${colName} : ${this.normalizeTypeForPlantUML(colType)}\n`
        })
      }

      plantuml += `}\n\n`
    })

    plantuml += "\n@enduml\n"
    return plantuml
  }

  /**
   * Generate ERD description in markdown format
   */
  generateMarkdownERD(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const schema = archContent.database_schema || {}
    const tables = schema.tables || []
    const tablesArray = Array.isArray(tables) ? tables : []

    let markdown = `# Entity Relationship Diagram\n\n`
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`
    markdown += `## Database Schema: ${this.diagram.title}\n\n`

    if (tablesArray.length === 0) {
      markdown += `No database schema found in this diagram.\n`
      return markdown
    }

    markdown += `### Tables\n\n`

    tablesArray.forEach((table: any) => {
      const tableName = table.table_name || table.name || "Table"
      markdown += `#### ${tableName}\n\n`

      if (table.columns) {
        markdown += `| Column | Type | Constraints | Description |\n`
        markdown += `|--------|------|-------------|-------------|\n`

        const columns = Array.isArray(table.columns) ? table.columns : []
        columns.forEach((col: any, idx: number) => {
          const colName = typeof col === "object" ? col.name : col
          const colType = typeof col === "object" ? col.type || "VARCHAR" : "VARCHAR"
          const constraints = typeof col === "object" && col.constraints
            ? (Array.isArray(col.constraints) ? col.constraints.join(", ") : col.constraints)
            : ""
          const description = typeof col === "object" ? col.description || "" : ""
          const isPrimaryKey = constraints.includes("PRIMARY KEY") || idx === 0

          markdown += `| ${isPrimaryKey ? "**" : ""}${colName}${isPrimaryKey ? "**" : ""} | ${colType} | ${constraints || "-"} | ${description || "-"} |\n`
        })
        markdown += `\n`
      }
    })

    return markdown
  }

  private normalizeTypeForMermaid(type: string): string {
    const normalized = type.toUpperCase()
    if (normalized.includes("INT")) return "int"
    if (normalized.includes("VARCHAR") || normalized.includes("TEXT")) return "string"
    if (normalized.includes("BOOL")) return "boolean"
    if (normalized.includes("DATE")) return "date"
    if (normalized.includes("TIME")) return "datetime"
    if (normalized.includes("FLOAT") || normalized.includes("DOUBLE") || normalized.includes("DECIMAL")) return "float"
    return "string"
  }

  private normalizeTypeForPlantUML(type: string): string {
    const normalized = type.toUpperCase()
    if (normalized.includes("INT")) return "INTEGER"
    if (normalized.includes("VARCHAR")) return normalized
    if (normalized.includes("TEXT")) return "TEXT"
    if (normalized.includes("BOOL")) return "BOOLEAN"
    if (normalized.includes("DATE")) return "DATE"
    if (normalized.includes("TIME")) return "TIMESTAMP"
    if (normalized.includes("FLOAT") || normalized.includes("DOUBLE") || normalized.includes("DECIMAL")) {
      return "DECIMAL"
    }
    return normalized || "VARCHAR(255)"
  }
}

