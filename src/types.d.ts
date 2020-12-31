interface ReferenceResponse {
    success: boolean;
    data: Component;
}

interface Component {
    name: string;
    link: string;
    docstring: string;
}

type Components = Record<string, Component>;
