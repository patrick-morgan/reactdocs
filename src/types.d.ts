interface ReferenceResponse {
    success: boolean;
    data: Component;
}

interface GithubResponse {
    name: string;
    download_url: string;
}

interface Component {
    name: string;
    link: string;
    docstring: string;
}

type Components = Record<string, Component>;
