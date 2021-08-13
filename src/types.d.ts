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

interface Components {
  [x: string]: Component;
}
