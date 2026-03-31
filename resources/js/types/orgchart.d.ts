declare module '@balkangraph/orgchart.js' {
    export default class OrgChart {
        constructor(element: HTMLElement, config: any);
        
        destroy(): void;
        load(data: any[]): void;
        export(type: string): void;
        fit(): void;
        zoom(scale: number): void;
        expandAll(): void;
        collapseAll(): void;
    }
}