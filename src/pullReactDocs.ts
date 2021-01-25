import axios from 'axios';

import ReactReferenceParser from './parsers/ReactReferenceParser';

const reactReferenceUrl = "https://raw.githubusercontent.com/reactjs/reactjs.org/master/content/docs/reference-react.md";
const reactComponentReferenceUrl = "https://raw.githubusercontent.com/reactjs/reactjs.org/master/content/docs/reference-react-component.md";
const hooksReferenceUrl = "https://raw.githubusercontent.com/reactjs/reactjs.org/master/content/docs/hooks-reference.md";

export const getDocs = async () => {
    const urls = [reactReferenceUrl, reactComponentReferenceUrl, hooksReferenceUrl];

    // get markdown
    const promises = urls.map(url => axios.get<string>(url));
    const responses = await Promise.all(promises);

    const componentsList: Component[][] = responses.map(response => {
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


