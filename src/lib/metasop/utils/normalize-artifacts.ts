import type { BackendArtifactData } from "../types"

type ArtifactBundle = Record<string, { content?: BackendArtifactData } | undefined>

const toRecordEntries = (value: unknown): Array<{ name: string; type: string }> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return []

    return Object.entries(value as Record<string, unknown>).map(([name, type]) => ({
        name,
        type: typeof type === "string" ? type : String(type)
    }))
}

const normalizeEngineer = (content: Record<string, unknown>) => {
    if (!content) return

    delete content.plan
    delete content.phases
    delete content.files
    delete content.file_changes
    delete content.components
}

const normalizeUIDesigner = (content: Record<string, unknown>) => {
    if (!content) return

    delete content.schema_version
    delete content.component_blueprint

    if (Array.isArray(content.component_specs)) {
        content.component_specs = (content.component_specs as Array<Record<string, unknown>>).map((spec: Record<string, unknown>) => {
            const { props } = spec
            if (spec && props && !Array.isArray(props)) {
                return {
                    ...spec,
                    props: toRecordEntries(props)
                }
            }
            return spec
        })
    }
}

const normalizeDevOps = (content: Record<string, unknown>) => {
    if (!content) return

    delete content.cloud_provider
    delete content.infra_components
}

const normalizeSecurity = (content: Record<string, unknown>) => {
    if (!content) return
}

const normalizeArchitect = (content: Record<string, unknown>) => {
    if (!content) return

    if (Array.isArray(content.apis)) {
        content.apis = (content.apis as Array<Record<string, unknown>>).map((api: Record<string, unknown>) => {
            const { endpoint } = api
            if (api && endpoint && !api.path) {
                return { ...api, path: endpoint, endpoint: undefined }
            }
            if (api && endpoint) {
                const { endpoint: _endpoint, ...rest } = api
                return rest
            }
            return api
        })
    }
}

const normalizePm = (content: Record<string, unknown>) => {
    if (!content) return

    if (Array.isArray(content.user_stories)) {
        content.user_stories = (content.user_stories as unknown[]).filter(Boolean)
    }

    if (Array.isArray(content.acceptance_criteria)) {
        content.acceptance_criteria = (content.acceptance_criteria as unknown[]).filter(Boolean)
    }
}

const normalizeQa = (content: Record<string, unknown>) => {
    if (!content) return

    if (Array.isArray(content.test_cases)) {
        content.test_cases = (content.test_cases as Array<Record<string, unknown>>).map((testCase: Record<string, unknown>) => {
            if (testCase && typeof testCase.priority !== "string") {
                const { priority: _priority, ...rest } = testCase
                return rest
            }
            return testCase
        })
    }
}

export const normalizeArtifacts = (artifacts: ArtifactBundle) => {
    const normalized: ArtifactBundle = {}

    Object.entries(artifacts || {}).forEach(([key, artifact]) => {
        if (!artifact || typeof artifact !== "object") {
            normalized[key] = artifact
            return
        }

        const typedArtifact = artifact as { content?: BackendArtifactData }

        const { content } = typedArtifact
        if (!content || typeof content !== "object") {
            normalized[key] = artifact
            return
        }

        if (key === "engineer_impl") normalizeEngineer(content)
        if (key === "ui_design") normalizeUIDesigner(content)
        if (key === "devops_infrastructure") normalizeDevOps(content)
        if (key === "security_architecture") normalizeSecurity(content)
        if (key === "arch_design") normalizeArchitect(content)
        if (key === "pm_spec") normalizePm(content)
        if (key === "qa_verification") normalizeQa(content)

        normalized[key] = { ...typedArtifact, content }
    })

    return normalized
}
