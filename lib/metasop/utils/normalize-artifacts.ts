type AnyRecord = Record<string, any>

type ArtifactBundle = Record<string, { content?: AnyRecord } | undefined>

const toRecordEntries = (value: any): Array<{ name: string; type: string }> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return []

    return Object.entries(value).map(([name, type]) => ({
        name,
        type: typeof type === "string" ? type : String(type)
    }))
}

const normalizeEngineer = (content: AnyRecord) => {
    if (!content) return

    delete content.plan
    delete content.phases
    delete content.files
    delete content.file_changes
    delete content.components
}

const normalizeUIDesigner = (content: AnyRecord) => {
    if (!content) return

    delete content.schema_version
    delete content.component_blueprint

    if (Array.isArray(content.component_specs)) {
        content.component_specs = content.component_specs.map((spec: AnyRecord) => {
            if (spec && spec.props && !Array.isArray(spec.props)) {
                return {
                    ...spec,
                    props: toRecordEntries(spec.props)
                }
            }
            return spec
        })
    }
}

const normalizeDevOps = (content: AnyRecord) => {
    if (!content) return

    delete content.cloud_provider
    delete content.infra_components
}

const normalizeSecurity = (content: AnyRecord) => {
    if (!content) return
}

const normalizeArchitect = (content: AnyRecord) => {
    if (!content) return

    if (Array.isArray(content.apis)) {
        content.apis = content.apis.map((api: AnyRecord) => {
            if (api && api.endpoint && !api.path) {
                return { ...api, path: api.endpoint, endpoint: undefined }
            }
            if (api && api.endpoint) {
                const { endpoint, ...rest } = api
                return rest
            }
            return api
        })
    }
}

const normalizePm = (content: AnyRecord) => {
    if (!content) return

    if (Array.isArray(content.user_stories)) {
        content.user_stories = content.user_stories.filter(Boolean)
    }

    if (Array.isArray(content.acceptance_criteria)) {
        content.acceptance_criteria = content.acceptance_criteria.filter(Boolean)
    }
}

const normalizeQa = (content: AnyRecord) => {
    if (!content) return

    if (Array.isArray(content.test_cases)) {
        content.test_cases = content.test_cases.map((testCase: AnyRecord) => {
            if (testCase && typeof testCase.priority !== "string") {
                const { priority, ...rest } = testCase
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

        const content = artifact.content
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

        normalized[key] = { ...artifact, content }
    })

    return normalized
}
