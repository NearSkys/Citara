// Graph Module
import { UI } from './ui.js';

export const Graph = {
    data: {
        nodes: [],
        links: []
    },
    instance: null,

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.instance = ForceGraph()(container)
            .width(container.offsetWidth)
            .height(container.offsetHeight)
            .graphData(this.data)
            .nodeLabel('title')
            .nodeColor(() => '#3b82f6') // Primary blue
            .linkColor(() => '#cbd5e1') // Slate 300
            .backgroundColor('#ffffff')
            .nodeRelSize(6)
            .onNodeClick(node => {
                // Trigger UI details panel
                UI.showDetails(node);

                // Center view on node
                this.instance.centerAt(node.x, node.y, 1000);
                this.instance.zoom(2, 2000);
            });

        // Handle resize
        window.addEventListener('resize', () => {
            if (container && this.instance) {
                this.instance.width(container.offsetWidth);
                this.instance.height(container.offsetHeight);
            }
        });
    },

    addPaper(paper) {
        // Check if exists
        if (this.data.nodes.find(n => n.id === paper.id)) return;

        this.data.nodes.push({ ...paper, val: 1 });
        this.update();
    },

    addCitation(sourceId, targetPaper) {
        // Add target node if not exists
        if (!this.data.nodes.find(n => n.id === targetPaper.id)) {
            this.data.nodes.push({ ...targetPaper, val: 1 });
        }

        // Add link if not exists
        if (!this.data.links.find(l => l.source === sourceId && l.target === targetPaper.id)) {
            this.data.links.push({ source: sourceId, target: targetPaper.id });
        }

        this.update();
    },

    update() {
        if (this.instance) {
            // Create a new object reference to trigger update
            this.instance.graphData({
                nodes: [...this.data.nodes],
                links: [...this.data.links]
            });
        }
    }
};
