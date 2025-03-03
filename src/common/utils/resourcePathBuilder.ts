import resources from './resources.json';

type BuildPaths<T extends ModuleTree> = {
    [K in keyof T]: {
        path: T[K]['path'];
    } & (T[K]['children'] extends ModuleTree ? {
        children: BuildPaths<T[K]['children']>;
    } : {});
};

function buildPaths<T extends ModuleTree>(tree: T): BuildPaths<T> {
    return Object.entries(tree).reduce((acc, [key, node]) => ({
        ...acc,
        [key]: {
            path: node.path,
            ...(node.children ? {
                children: buildPaths(node.children)
            } : {})
        }
    }), {} as BuildPaths<T>);
}

const Modules = buildPaths(resources.resources);

export { Modules }