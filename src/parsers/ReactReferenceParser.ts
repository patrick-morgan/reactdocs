import fromMarkdown = require('mdast-util-from-markdown');
import toMarkdown = require('mdast-util-to-markdown');
import * as mdast from 'mdast';

export default class ReactReferenceParser {
    tree: mdast.Root;
    permalink: string = "";
    components: Component[] = [];

    constructor(markdown: string) {
        const tree = fromMarkdown(markdown);
        this.tree = tree;
    }

    parse() {
        this.setLink();
        this.setComponents();

        return this.components;
    }

    setLink() {
        const firstChild = this.tree.children[0] as mdast.ThematicBreak;
        const secondChild = this.tree.children[1] as mdast.Paragraph;

        const docDetailsContent: mdast.Text = secondChild.children[0] as mdast.Text;
        const docDetails = docDetailsContent.value.split("\n");

        let permalink = "";

        for (const detail of docDetails) {
            const [key, value] = detail.split(":");
            if (key === "permalink") permalink = value.trim();
        }

        if (permalink === "")
            throw Error("Assertion violated: second markdown object of the React doc should include a permalink"); 

        this.permalink = `https://reactjs.org/${permalink}`; 
    }

    setComponents() {
        const nodes: mdast.Content[] = this.tree.children;
        
        // Go through each component
        const components: Component[] = [];
        let currentComponent: Component = { name: "", link: "", docstring: "" };
        let currentComponentDocs: Array<mdast.Content> = [];
        let noticeCurrentComponent = false;
        for (let i = 0; i < nodes.length; i++) {
            const node: mdast.Content = nodes[i];
            const isH3 = (node.type === "heading" && node.depth === 3);
            if (isH3) {
                if (noticeCurrentComponent && currentComponentDocs.length > 0) {
                    // found next component, push current
                    const docsMdast = { "type": "root", "children": currentComponentDocs };
                    currentComponent.docstring = toMarkdown(docsMdast);
                    components.push(currentComponent);
                }

                // reset vars
                currentComponent = { name: "", link: "", docstring: "" };
                currentComponentDocs = [];
                noticeCurrentComponent = true;

                const children = node.children as mdast.Content[];
                let name = children[0].value as string;
                name = name.replace(/\(\)/g, "");
                
                let names = name.split(" ");
                name = names[names.length - 1];

                names = name.split(".");
                currentComponent.name = names[names.length - 1];

                if (children[0].type !== "inlineCode") noticeCurrentComponent = false;
                else {
                    const anchor = (children[1].value as string).slice(2, -1);
                    currentComponent.link = `${this.permalink}${anchor}`;
                }
            } else if (noticeCurrentComponent) {
                currentComponentDocs.push(node);
            }
        }
        
        if (noticeCurrentComponent) {
            const docsMdast = { "type": "root", "children": currentComponentDocs };
            currentComponent.docstring = toMarkdown(docsMdast);
            components.push(currentComponent);
        }

        this.components = components;
    }
}
