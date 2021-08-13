import axios from "axios";
import ReactReferenceParser from "./parsers/ReactReferenceParser";

export const getDocs = async () => {
  const rootUrl =
    "https://api.github.com/repos/reactjs/reactjs.org/contents/content/docs";
  const files: [GithubResponse] = (await axios.get(rootUrl)).data;
  const markdownFiles = files.filter(
    (file) => file.name.slice(-2).toLowerCase() === "md"
  );

  let urls = markdownFiles.map((file) => file.download_url);

  // get markdown
  const promises = urls.map((url) => axios.get<string>(url));
  const responses = await Promise.all(promises);
  const componentsList: Component[][] = responses.map((response) => {
    const parser = new ReactReferenceParser(response.data);
    return parser.parse();
  });
  const components: Component[] = componentsList.reduce(
    (prevList, currentList) => prevList.concat(currentList)
  );

  const lookup: Components = {};
  for (const { name, link, docstring } of components) {
    lookup[name] = { name, link, docstring };
  }

  return lookup;
};
