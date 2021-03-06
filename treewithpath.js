/**
 * The class of the TreeWithPath tree
 */
class Tree
{
    /**
     * Creates a tree
     *
     * @param data Tree root node data. The name of the root node is always root
     * @constructor
     * @example
     * const Tree = require("treewithpath");
     * const tree = new Tree({ text: "Hello, world!", "otherText": "hoI!" });
     */
    constructor(data) {
        this._root = new Node("root", data, this);
    }

    /**
     * Root node of this tree
     * 
     * @returns {Node} Root node
     * @this {Tree}
     */
    get root() {
        return this._root;
    }

    /**
     * Adds a node to the tree and returns it
     *
     * @param {string} name The name of the node to add
     * @param data The data of the node to be created
     * @param {string} path The path to the parent of the node to create
     * @this {Tree} Tree
     * @return {Node} Created node
     * @throws {TreeError} In case the node already exists
     * @example
     * tree.add("node2", { text: "Hello, world!", "otherText": "hoI!" }, "/node1");
     */
    add(name, data, path) {
        if (this.has(Tree.joinPath(path, name))) {
            throw new TreeError("This node already exists");
        }

        const node = new Node(name, data, this);
        this.get(path)._children.push(node);
        return node;
    }

    /**
     * Gets the node at the specified path
     *
     * @param {string} path The path to the node to receive
     * @param {boolean} error Optional parameter. The default is true. If true, an exception will be thrown if the path is incorrect. Otherwise, null will be returned
     * @this {Tree} Tree
     * @returns {Node | null} The resulting node or null if error = false and node not found
     * @throws {TreeError} In case the node is not found and error = true
     * @example
     * tree.get("/node1");
     */
    get(path, error = true) {
        let current = [this.root];
        const parsedPath = parsePath(path);

        for (const [ index, node ] of parsedPath.entries()) {
            const currentNode = current.find(currentNode => currentNode.name === node);

            if (currentNode !== undefined) {
                current = currentNode._children;

                if (index === parsedPath.length - 1) {
                    return currentNode;
                }
            } else if (error) {
                throw new TreeError(`${node}: Node not exists`);
            } else {
                return null;
            }
        }
    }

    /**
     * Deletes the node and returns it at the specified path
     *
     * @param {string} path The path to the node to be deleted
     * @this {Tree} Tree
     * @returns {Node} A deleted node that no longer contains children. Children are permanently deleted
     * @throws {TreeError} In case the node is not found
     * @example
     * tree.remove("/node1");
     */
    remove(path) {
        const node = this.get(path);
        node.remove();
        return node;
    }

    /**
     * Calls a callback for each node in the tree
     *
     * @param {Function} callback A function called for each node of the tree. The node in the first argument is passed to the function
     * @this {Tree} Tree
     * @example
     * tree.traverse(node => {
     *   console.log(node.name);
     * });
     */
    traverse(callback) {
        this.root.traverse(callback);
    }

    /**
     * Returns a tree object suitable for storage in JSON format. This method is mainly used by the JSON.stringify function
     *
     * @this {Tree} Tree
     * @returns {object} A tree object suitable for storage in JSON format
     * @example
     * tree.toJSON(); // { name: "root", data: { text: "Hello, world!", "otherText": "hoI!" }, children: [{ name: "node1", data: { text: "Hello, world!", "otherText": "hoI!" }, children: [{ name: "node2", data: {text: "Hello, world!", "otherText": "hoI!" }, children: [] }] }
     */
    toJSON() {
        return this.root.toJSON();
    }

    /**
     * Checks a node for existence in a tree
     * 
     * @param {string} path The path to the node to check
     * @returns {boolean} True if the node exists and false if it does not exist
     * @this {Tree} Tree
     * @example
     * tree.has("/notExists/child") // false
     * tree.has("/exists") // true
     */
    has(path) {
        return this.get(path, false) !== null;
    }

    /**
     * Creates a tree from an object that returns the toJSON() method
     *
     * @param {object} json A tree object suitable for storage in JSON format
     * @returns {Tree} Created tree
     * @example
     * const tree = Tree.fromJSON({ name: "root", data: { text: "Hello, world!", "otherText": "hoI!" }, children: [{name: "node1", data: {text: "Hello, world!", "otherText": "hoI!"}, children: [{name: "node2", data: {text: "Hello, world!", "otherText": "hoI!"}, children: [] }] });
     */
    static fromJSON(json) {
        const tree = new Tree(json.data);

        function recurse(recurseJson, addTo) {
            for (const node of recurseJson) {
                recurse(node.children, addTo.addChild(node.name, node.data));
            }
        };

        recurse(json.children, tree.root);
        return tree;
    }

    /**
     * Connects the two specified paths into one.
     *
     * @param {string} firstPath First path
     * @param {sting} secondPath Second path
     * @returns {string} United path
     * @example
     * Tree.joinPath("/node1", "node2") // /node1/node2
     */
    static joinPath(firstPath, secondPath) {
        if (firstPath.endsWith("/") && secondPath.startsWith("/")) {
            return firstPath.substr(0, firstPath.length - 1) + secondPath;
        } else if (firstPath.endsWith("/") || secondPath.endsWith("/") || secondPath.startsWith("/")) {
            return firstPath + secondPath;
        } else {
            return `${firstPath}/${secondPath}`;
        }
    }
}

/**
 * Node class
 */
class Node
{
    /**
     * Creates an instance of a node. Do not use this constructor yourself. To add nodes, use the add and addChild methods
     * 
     * @param {string} name The name of the node
     * @param data Node data
     * @param {Tree} tree The tree to which the node will belong
     * @constructor
     */
    constructor(name, data, tree) {
        /**
         * Name of this node
         */
        this.name = name;

        /**
         * Data of this node
         */
        this.data = data;

        /** @private */
        this._children = [];

        this._tree = tree;
    }

    /**
     * The tree to which the node will belong
     * 
     * @returns {Tree} Tree to which the node will belong
     * @this {Node}
     */
    get tree() {
        return this._tree;
    }

    /**
     * Getter to get the path to this node
     * 
     * @returns {string} The path to this node
     * @this {Node} Node
     * @throws {TreeError} In case this node does not belong to any tree
     */
    get path() {
        if (this.tree == null) {
            throw new TreeError("This node does not belong to any tree");
        }

        const parentsArray = [];
        function recurse(node) {
            if (node != null) {
                parentsArray.push(node);
                return recurse(node.parent);
            } else {
                return parentsArray;
            }
        }

        const pathArray = recurse(this);
        pathArray.pop();
        return `/${pathArray.map(node => node.name).reverse().join("/")}`;
    }

    /**
     * Getter to get the parent of this node
     * 
     * @returns {Node} Parent of this node
     * @this {Node} Node
     * @throws {TreeError} In case this node does not belong to any tree
     */
    get parent() {
        if (this.tree == null) {
            throw new TreeError("This node does not belong to any tree");
        }

        if (this.tree.root._children.includes(this)) {
            return this.tree.root;
        }
        
        function recurse(children) {
            const parent = children.find((item) => item._children.includes(this));
            
            if (parent != null) {
                return parent;
            } else {
                for (const child of children) {
                    return recurse.call(this, child._children);
                }
            }
        }

        return recurse.call(this, this.tree.root._children);
    }

    /**
     * A getter that returns an array of children of the given node
     *
     * @this {Node} Node
     * @returns {Array} Array of children for this node
     */
    get children() {
        return this._children;
    }

    /**
     * Deletes the given node and its children
     * 
     * @this {Node} Node
     * @throws {TreeError} In case this node does not belong to any tree
     * @throws {TreeError} If this node is the root
     */
    remove() {
        if (this.tree == null) {
            throw new TreeError("This node does not belong to any tree");
        }

        if (this.parent == null) {
            throw new TreeError("Cannot remove root node");
        } else {
            this.parent._children.splice(this.parent._children.indexOf(this), 1);
            this._tree = null;
            this._children = null;
        }
    }

    /**
     * Adds a child to this node
     * 
     * @param {string} name The name of the node to add
     * @param data The data of the node being added
     * @this {Node} Node
     * @throws {TreeError} In case this node does not belong to any tree
     * @throws {TreeError} In case the node already exists
     */
    addChild(name, data) {
        if (this.tree == null) {
            throw new TreeError("This node does not belong to any tree")
        }

        if (this.tree.has(Tree.joinPath(this.path, name))) {
            throw new TreeError("This node already exists");
        }

        const node = new Node(name, data, this.tree);
        this._children.push(node);
        return node;
    }

    /**
     * Returns a node object suitable for storage in JSON format. This method is mainly used by the JSON.stringify function
     *
     * @this {Node} Node
     * @returns {object} A node object suitable for storage in JSON format
     * @example
     * node.toJSON(); // { name: "root", data: { text: "Hello, world!", "otherText": "hoI!" }, children: [{ name: "node1", data: {text: "Hello, world!", "otherText": "hoI!" }, children: [{ name: "node2", data: { text: "Hello, world!", "otherText": "hoI!" }, children: [] }] }
     */
    toJSON() {
        return { name: this.name, data: this.data, children: this._children };
    }

    /**
     * Calls a callback for each child node of this node
     *
     * @param {Function} callback A function called for child node of this node The node in the first argument is passed to the function
     * @this {Node} Node
     * @example
     * node.traverse(node => {
     *   console.log(node.name);
     * });
     */
    traverse(callback) {
        function recurse(node) {
            callback(node);

            for (const child of node._children) {
                recurse(child);
            }
        }

        recurse(this);
    }
}

/**
 * It is a TreeWithPath error class.
 * @private
 */
class TreeError extends Error {
    constructor(message) {
        super(message);
        this.name = "TreeError";
    }
}

/** @private */
function parsePath(path) {
    if (path.startsWith("/")) {
        const pathArray = path.split("/");
        pathArray[0] = "root";

        if (pathArray[pathArray.length - 1] == "") {
            pathArray.pop();
        }

        return pathArray;
    } else {
        throw new TreeError("Wrong path");
    }
}

module.exports = Tree;