export function caseStudyReaderTitle(study: { title?: string; codename: string }): string {
    const title = (study.title ?? '').trim()
    const prefix = `${study.codename}: `

    if (title.startsWith(prefix)) {
        return title.slice(prefix.length)
    }

    return title || study.codename
}
