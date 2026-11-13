// Interface seams for later lifecycle work. They have NO implementation here
// and the validation pipeline never calls them (Req 3.5). This feature does
// not build, test, preview, or activate anything, and it never loads code.

/** A later stage that builds an artifact. */
export interface BuildSeam {
  readonly id: "build";
}

/** A later stage that tests an artifact. */
export interface TestSeam {
  readonly id: "test";
}

/** A later stage that previews a version without replacing the active one. */
export interface PreviewSeam {
  readonly id: "preview";
}

/** A later stage that activates a version through an atomic pointer. */
export interface ActivationSeam {
  readonly id: "activation";
}

export type FutureSeam = BuildSeam | TestSeam | PreviewSeam | ActivationSeam;
