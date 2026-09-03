export const GLM_MODELS = [
  { id: "glm-5.3-flash", label: "GLM-5.3 Flash" },
  { id: "glm-5.2", label: "GLM-5.2" },
  { id: "glm-5-turbo", label: "GLM-5 Turbo" },
  { id: "glm-4.5-flash", label: "GLM-4.5 Flash" },
] as const;

export const DEFAULT_GLM_MODEL = GLM_MODELS[0].id;

export const VALID_GLM_MODEL_IDS = new Set<string>(
  GLM_MODELS.map((model) => model.id),
);
