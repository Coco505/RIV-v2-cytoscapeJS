/**
 * @fileOverview AIV2, Arabidopsis Interactions Viewer Two. Main JS file that powers the front-end of AIV 2.0. Shows PPIs and PDIs and additional API data for a given gene(s).
 * @version 2.0, Jul2018
 * @author Vincent Lau (major additions, AJAX, polishing, CSS, SVGs, UX/UI, filters, exports, tables, tooltips) <vincente.lau@mail.utoronto.ca>
 * @author Asher Pasha (prototype base app, some logic of adding nodes & edges)
 * @copyright see MIT license on GitHub
 * @description please note that I seldom intentionally used data properties to nodes instead of classes as we cannot ( to my knowledge), select nodes by NOT having a class
 */
(function(window, $, _, cytoscape, alertify, undefined) {
    'use strict';

    /** @namespace {object} AIV */
    var AIV = {};

    /**
     * @namespace {object} AIV - Important hash tables to store state data and styling global data
     * @property {object} chromosomesAdded - Object property for 'state' of how many PDI chromosomes exist
     // * @property {boolean} mapManLoadState - Boolean property representing if mapMan AJAX call was successful
     * @property {boolean} SUBA4LoadState - Boolean property representing if SUBA4 AJAX call was successful
     * @property {object} exprLoadState - State of the expression values the user has loaded for the current query genes
     * @property {number} nodeSize - "Global" default data such as default node size
     * @property {number} DNANodeSize - Important for adjusting the donut sizes
     * @property {number} searchNodeSize - Size for search genes
     * @property {string} nodeDefaultColor - hexcode for regular nodes by default (no expression data)
     * @property {string} searchNodeColor - hexcode for search genes background
     * @propery {object} locColorAssignments - the corresponding hexcodes for the localizations in the object keys
     * @property {Array.<string>} locCompoundNodes - this node will hopefully be filled with the parent nodes for localizations that exist on the app currently
     * @propery {boolean} coseParentNodesOnCyCore - state variable that stores whether compound nodes have been loaded onto the cy core app
     * @property {number} defaultZoom - contains a number for how much graph has been zoomed (after a layout has been ran)
     * @property {object} defaultPan - contains x and y properties for where the graph has been panned, useful for layouts
     * @property {object} miFilter - a list of unuseful mi terms that ideally would be filled out if a PPI/PDI does not have another meaningful name
     * @property {object} miTerms - a dictionary of frequently occuring (needs to be curated manually as EMBL doesn't have an API) MI terms that come from our dapseq ppi webservice
     // * @property {object} mapManDefinitions - a dictionary of of MapMan terms (first number/hierarchical category)
     // * @property {object} mapManOnDom - state variable dictionary that stores which MapMan BINs are in the app; used for when adding to the dropdown
     */
    AIV.chromosomesAdded = {};
    // AIV.mapManLoadState = false;
    AIV.SUBA4LoadState = false;
    AIV.exprLoadState = {absolute: false, relative: false};
    AIV.nodeSize = 35;
    AIV.DNANodeSize = 55;
    AIV.searchNodeSize = 65;
    AIV.nodeDefaultColor = '#cdcdcd';
    AIV.searchNodeColor = '#ffffff';
    AIV.locColorAssignments = {
        Cytoskeleton : "#572d21",
        Cytosol      : "#e0498a",
        "Endoplasmic reticulum" : "#d1111b",
        Extracell: "#ffd672",
        Golgiapparatus        : "#fffdbf",
        Mitochondria: "#41abf9",
        Nucleus      : "#0021a4",
        Peroxisome   : "#650065",
        "Plasma membrane" : "#ffae00",
        Plastid      : "#006007",
        Vacuole      : "#ffe901",
        Cytoplasm      : "#CC8FE6",
        Cellmembrane    : "#9bffe7",
        Cellwall    : "#99ff00",
        Chloroplast    : "#0066ff"

    };
    AIV.locCompoundNodes = [];
    AIV.coseParentNodesOnCyCore  = false;
    AIV.defaultZoom = 1;
    AIV.defaultPan = {x: 0, y:0};
    AIV.miFilter =["0469" , "0463", "0467", "0190", "1014", "0915", "0914", "0407", "0686", "0045", "0462"];
    AIV.miTerms =
    {
        "0004" : "affinity chromotography technology",
        "0007" : "anti tag co-immunoprecipitation",
        "0018" : "two hybrid",
        "0019" : "coimmunoprecipitation",
        "0030" : "cross-linking study",
        "0045" : "experimental interaction detection",
        "0047" : "far western blotting",
        "0055" : "fluorescent resonance energy transfer",
        "0064" : "interologs mapping",
        "0065" : "isothermal titration calorimetry",
        "0067" : "tandem affinity purification",
        "0071" : "molecular sieving",
        "0084" : "phage display",
        "0085" : "phylogenetic profile",
        "0096" : "pull down",
        "0112" : "ubiquitin reconstruction",
        "0190" : "reactome",
        "0217" : "phosphorylation reaction",
        "0364" : "inferred by curator",
        "0397" : "two hybrid array",
        "0407" : "direct interaction",
        "432"  : "one hybrid", // error in the database, not a 4 digit num
        "0432" : "one hybrid",
        "0437" : "protein three hybrid",
        "0462" : "bind",
        "0463" : "biogrid",
        "0467" : "reactome",
        "0469" : "intact",
        "0686" : "unspecified method",
        "0809" : "bimolecular fluorescence complementation",
        "0914" : "association",
        "0915" : "physical association",
        "1014" : "string",
        "1178" : "sequence based prediction of binding of transcription factor to transcribed gene regulatory elements",
        "2189" : "avexis"
    };
    // AIV.mapManDefinitions =
    // {
    //     "0" : "Control",
    //     "1" : "PS",
    //     "2" : "Major CHO metabolism",
    //     "3" : "Minor CHO metabolism",
    //     "4" : "Glycolysis",
    //     "5" : "Fermentation",
    //     "6" : "Gluconeogensis",
    //     "7" : "OPP",
    //     "8" : "TCA/org. transformation",
    //     "9" : "Mitochondrial electron transport",
    //     "10": "Cell wall",
    //     "11": "Lipid Metabolism",
    //     "12": "N-metabolism",
    //     "13": "Amino acid metabolism",
    //     "14": "S-assimilation",
    //     "15": "Metal handling",
    //     "16": "Secondary metabolism",
    //     "17": "Hormone metabolism",
    //     "18": "Co-factor and vitamin metabolism",
    //     "19": "Tetrapyrrole synthesis",
    //     "20": "Stress",
    //     "21": "Redox",
    //     "22": "Polyamine metabolism",
    //     "23": "Nucleotide metabolsim",
    //     "24": "Biodegradation of xenobiotics",
    //     "25": "C1-metabolism",
    //     "26": "Misc.",
    //     "27": "RNA",
    //     "28": "DNA",
    //     "29": "Protein",
    //     "30": "Signalling",
    //     "31": "Cell",
    //     "32": "Micro RNA, natural antisense etc.",
    //     "33": "Development",
    //     "34": "Transport",
    //     "35": "Not assigned",
    //     "991": "Mineral nutrition"
    // };
    // AIV.mapManOnDom = {};

    /**
     * @namespace {object} AIV
     * @function initialize - Call bindUIEvents as the DOM has been prepared and add namespace variable
     */
    AIV.initialize = function() {
        // Set AIV namespace in window
        window.aivNamespace = {};
        window.aivNamespace.AIV = AIV;
        // Bind User events
        this.bindSubmit();
    };

    /**
     * @namespace {object} AIV
     * @function bindSubmit - Add functionality to buttons when DOM is loaded
     */
    AIV.bindSubmit = function() {
        // Submit button
        $('#submit').click(function(e) {
            // Stop system submit, unless needed later on
            e.preventDefault();

            // Get the list of genes
            let genes = $.trim($('#genes').val());
            genes = AIV.formatAGI(genes); //Format to keep "LOC_Os02g10000" format when identifying unique nodes, i.e. don't mixup between LOC_OS02G10000 and LOC_Os02g10000 and add a node twice
            let geneArr = genes.split('\n');

            for (let i = 0; i < geneArr.length; i++) { // gene form input verification
                if(!geneArr[i].match(/^LOC_OS(0[1-9]|1[0-2])G\d{5}$/i)){
                    document.getElementById('errorModalBodyMsg').innerText = "Please check form value before adding submission! Genes should be delimited by newlines and follow the RGI format.";
                    $('#formErrorModal').modal('show');
                    throw new Error('wrong submission');
                }
            }

            if (genes !== '' && $('.form-chk-needed:checked').length > 0) {
                document.getElementById('loading').classList.remove('loaded'); //remove previous loading spinner
                let iconNode = document.createElement("i");
                iconNode.classList.add('fa');
                iconNode.classList.add('fa-spinner');
                iconNode.classList.add('fa-spin');
                document.getElementById('loading').appendChild(iconNode); // add loading spinner

                $('#formModal').modal('hide'); // hide modal

                AIV.genesList = geneArr;

                // Clear existing data
                AIV.resetUI();
                if (typeof AIV.cy !== 'undefined') {
                    AIV.cy.destroy(); //destroy cytoscape app instance
                    AIV.cy.contextMenus('get').destroy(); // delete bound right-click menus
                    AIV.resetState();
                }
                // cy.destroy() removes all child nodes in the #cy div, unfortunately we need one for the expr gradient, so reinstate it manually
                $('#cy').append('<canvas id="exprGradientCanvas" width="70" height="300"></canvas>');
                AIV.initializeCy(false);

                AIV.loadData();
            }
            else if ($('.form-chk-needed:checked').length <= 0) {
                document.getElementById('errorModalBodyMsg').innerText = "Please check a protein database!"
                $('#formErrorModal').modal('show');
                throw new Error('wrong submission');
            }
        });

    };

    /**
     * @namespace {object} AIV
     * @function resetState - Reset existing built-in state data from previous query
     */
    AIV.resetState = function() {
        this.chromosomesAdded = {};
        // this.mapManLoadState = false;
        this.SUBA4LoadState = false;
        this.exprLoadState = {absolute: false, relative: false};
        this.coseParentNodesOnCyCore = false;
        this.locCompoundNodes = [];
        // this.mapManOnDom = {};
        // clear memoized memory
        AIV.memoizedSanRefIDs.cache = new _.memoize.Cache;
        AIV.memoizedRetRefLink.cache = new _.memoize.Cache;
    };

    /**
     * @namespace {object} AIV
     * @function resetUI - Reset UI features that are run once a query was executed
     */
    AIV.resetUI = function() {
        // reset the buttons
        $('.submit-reset').prop('checked', false);
        $(".fa-eye-slash").toggleClass('fa-eye fa-eye-slash');
        // Remove prior mapman definitions for that app state
        // $('#bootstrapDropDownMM').empty();

        //remove existing interactions table except headers
        $("#csvTable").find("tr:gt(0)").remove();
        $(".inf").remove();

        //reset the reference filters for the next query
        $("#refCheckboxes").empty();
    };

    /**
     * @namespace {object} AIV
     * @function formatAGI - helper function that takes in a capitalized AGI into the one we use i.e. AT3G10000 to At3g10000
     * @param {string} AGI
     * @returns {string} - formmated AGI, i.e. At3g10000
     */
    AIV.formatAGI = function (AGI){
        AGI = AGI.replace(/S/g,'s');
        AGI = AGI.replace(/G/g, 'g');
        return AGI;
    };

    /**
     * @namespace {object} AIV
     * @function getCySpreadLayout - Returns spread layout for Cytoscape
     */
    AIV.getCySpreadLayout = function() {
        let layout = {};
        layout.name = 'cose';
        layout.nodeDimensionsIncludeLabels = true;
        // layout.padding = 1;
        if (AIV.cy.nodes().length > 750 && document.getElementById('circleLyChkbox').checked){
            layout.name = 'circle';
        }
        else if (AIV.cy.nodes().length < 375){
            layout.boundingBox = {x1:0 , y1:0, w:this.cy.width(), h: (this.cy.height() - this.DNANodeSize) }; //set boundaries to allow for clearer PDIs (DNA nodes are locked to start at x:50,y:0)
        }
        layout.stop = function(){ //this callback gets ran when layout is finished
            AIV.defaultZoom = AIV.cy.zoom();
            AIV.defaultPan = Object.assign({}, AIV.cy.pan()); //make a copy instead of takign reference
        };
        return layout;
    };

    /**
     * @namespace {object} AIV
     * @function getCyCOSEBilkentLayout - Returns layout for Cytoscape
     */
    AIV.getCyCOSEBilkentLayout = function(){
        let layout = {};
        layout.name = 'cose-bilkent';
        layout.padding = 5;
        layout.animate = 'end';
        layout.fit = true;
        layout.stop = function(){ //this callback gets ran when layout is finished
            AIV.defaultZoom = AIV.cy.zoom();
            AIV.defaultPan = Object.assign({}, AIV.cy.pan()); //make a copy instead of takign reference
            AIV.cy.style() // see removeAndAddNodesForCompoundNodes for rationale of re-updating stylesheet
                .selector('.filterByReference').style({'display': 'none'})
                .selector('.pearsonfilterEPPI').style({'display': 'none'})
                .selector('.pearsonAndInterologfilterPPPI').style({'display': 'none'})
                .update();
        };
        return layout;
    };

    /**
     * @namespace {object} AIV
     * @function getCyCerebralLayout - Returns layout for Cytoscape
     */
    AIV.getCyCerebralLayout = function (){
        AIV.defaultZoom = 1; // reset zoom
        AIV.defaultPan = {x: 0, y:0}; // reset pan
        return window.cerebralNamespace.options;
    };

    /**
     * @namespace {object} AIV
     * @function getCyStyle - Returns initial stylesheet of Cytoscape
     */
    AIV.getCyStyle = function() {
        return (
            cytoscape.stylesheet()
            .selector('node')
                .style({
                    'label': 'data(name)', //'label' is alias for 'content'
                    'font-size': 10,
                    'min-zoomed-font-size': 8,
                    'background-color': this.nodeDefaultColor,
                    "text-wrap": "wrap", //mulitline support
                    'height': this.nodeSize,
                    'width': this.nodeSize,
                    'border-style' : 'solid',
                    'border-width' : '1px',
                    'border-color' : '#979797'
                })
            .selector('node[?queryGene]') //If same properties as above, override them with these values for search genes
                .style({
                    'font-size': 14,
                    'min-zoomed-font-size': 0.00000000001,
                    'z-index': 100,
                    'height' : this.searchNodeSize,
                    'width'  : this.searchNodeSize,
                    'background-color': this.searchNodeColor,
                })
            .selector('.filteredChildNodes') //add/(remove) this class to nodes to (un)filter display
                .style({
                    'display' : 'none',
                })
            // .selector('.hideMapManNodes') //add/(remove) this class to nodes to (un)display MapMan nodes with a specific MapMan number
            //     .style({
            //         'display' : 'none',
            //     })
            .selector('.pearsonfilterEPPI') //to hide/unhide experimentally determined elements
                .style({
                    'display' : 'none',
                })
            .selector('.filterByReference') //to hide/unhide published elements via reference
                .style({
                    'display' : 'none',
                })
            .selector('.pearsonAndInterologfilterPPPI') //to hide/unhide predicted determined elements
                .style({
                    'display' : 'none',
                })
            .selector('.DNAfilter') // hide chromosomes
                .style({
                    'display' : 'none',
                })
            .selector('edge')
                .style({
                    'haystack-radius': 0,
                    'width': '11', // default, should be only for published interactions
                    'opacity': 0.666,
                    'line-style': 'dashed',
                })
            .selector('node[id ^= "DNA"]')
                .style({
                    'background-color': '#D3D3D3',
                    'font-size': '1.1em',
                    'min-zoomed-font-size': 0.00000000001,
                    "text-valign": "center",
                    "text-halign": "center",
                    "border-style": "solid",
                    "border-color": "#000000",
                    "border-width": "5px",
                    'shape': 'square',
                    'z-index': 101,
                    'height': this.DNANodeSize,
                    'width': this.DNANodeSize,
                })
            .selector('node[id ^= "Effector"]')
                .style({
                    'shape': 'hexagon',
                    'background-color': '#00FF00'
                })
            .selector('[?compoundNode]') //select for ALL compound nodes
                .style({
                    'shape': 'roundrectangle',
                    'font-size' : 18,
                    'font-family' : "Verdana, Geneva, sans-serif",
                })
            .selector('#Cytoskeleton') //for compound nodes
                .style({
                    'background-color': '#e8e5e5',
                })
            .selector('#Cytosol') //for compound nodes
                .style({
                    'background-color': '#ffe7ff',
                })
            .selector('[id="Endoplasmic reticulum"]') //for compound nodes
                .style({
                    'background-color': '#ff8690',
                })
            .selector('#Extracell') //for compound nodes
                .style({
                    'background-color': '#ffe6ab',
                })
            .selector('#Golgiapparatus') //for compound nodes
                .style({
                    'background-color': '#fff8e9',
                })
            .selector('#Mitochondria') //for compound nodes
                .style({
                    'background-color': '#6cc0ff',
                })
            .selector('#Nucleus') //for compound nodes
                .style({
                    'background-color': '#5666ab',
                })
            .selector('#Peroxisome') //for compound nodes
                .style({
                    'background-color': '#ce69ce',
                })
            .selector('[id="Plasma membrane"]') //for compound nodes
                .style({
                    'background-color': '#f8bf46',
                })
            .selector('#Plastid') //for compound nodes
                .style({
                    'background-color': '#2e5932',
                })
            .selector('#Vacuole') //for compound nodes
                .style({
                    'background-color': '#fff055',
                })
            .selector('#Cytoplasm') //for compound nodes
                .style({
                    'background-color': '#ddc0ea',
                })
            .selector('#Cellmembrane') //for compound nodes
                .style({
                    'background-color': '#c4ffee',
                })
            .selector('#Cellwall') //for compound nodes
                .style({
                    'background-color': '#cdf88f',
                })
            .selector('#Chloroplast') //for compound nodes
                .style({
                    'background-color': '#5e9fff',
                })
            .selector('#unknown') //for compound nodes
                .style({
                    'background-color': '#fff',
                })
            .selector('.highlighted')
                .style({
                    'border-color' : '#979797',
                    'min-zoomed-font-size': 0.00000000001,
                    "text-background-opacity": 1,
                    "text-background-color": "yellow",
                    "text-background-shape": "roundrectangle",
                    "text-border-color": "#000",
                    "text-border-width": 1,
                    "text-border-opacity": 1,
                    "z-index": 102,
                    "font-size": 16
                })
            .selector('edge[target *= "Protein"]')
                .style({
                    'line-color' : '#acadb4'
                })
            .selector('edge[pearsonR > 0.5 ], edge[pearsonR < -0.5 ]')
                .style({
                    'line-color' : '#f5d363'
                })
            .selector('edge[pearsonR > 0.6 ], edge[pearsonR < -0.6 ]')
                .style({
                    'line-color' : '#ea801d'
                })
            .selector('edge[pearsonR > 0.7 ], edge[pearsonR < -0.7 ]')
                .style({
                    'line-color' : '#da4e2f'
                })
            .selector('edge[pearsonR > 0.8 ], edge[pearsonR < -0.8 ]')
                .style({
                    'line-color' : '#ac070e'
                })
            .selector('edge[?published]') // This is going to affect effectors too since they're all published
                .style({
                    'line-color' : '#99cc00',
                    'line-style' : 'solid'
                })
            .selector('edge[target *= "DNA"]')
                .style({
                    'line-color' : '#333435',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'unbundled-bezier',
                    'control-point-distances' : '50', // only for unbunlded-bezier edges (DNA edges)
                    'control-point-weights'   : '0.65',
                    'target-arrow-color' : '#333435',
                })
            .selector('edge[target *= "DNA"][num_species = 0]') //i.e. published PDI
                .style({
                    'line-color' : '#557e00',
                    'target-arrow-color' : '#557e00',
                })
            .selector('edge[num_species <= 2][num_species > 0], edge[num_species > -7203][num_species <= -9605]')
                .style({
                    'width' : '1'
                })
            .selector('edge[num_species > 2], edge[num_species > -4802][num_species <= -7203]')
                .style({
                    'width' : '3'
                })
            .selector('edge[num_species > 5], edge[num_species > -2401][num_species <= -4802]')
                .style({
                    'width' : '5'
                })
            .selector('edge[num_species > 10], edge[num_species >= -1][num_species <= -2401]')
                .style({
                    'width' : '7'
                })
        );
    };


    /**
     * @namespace {object} AIV
     * @function initializeCy - initialize Cytoscape with some default settings
     * @param {boolean} upload - boolean to determine how to initialize stylesheet based on if user is entering their own JSON
     */
    AIV.initializeCy = function(upload) {
        this.cy = cytoscape({
            container: document.getElementById('cy'),

            boxSelectionEnabled: false,

            autounselectify: true,

            style: upload ? [] : this.getCyStyle(),

            layout: {name: 'null'} //the init layout has 0 nodes so it doesn't matter what the layout is
        });
    };

    /**
     * @namespace {object} AIV
     * @function getWidth - Get PPI edge width based on number of species
     * @description - not currently used, see stylesheet
     * @param {number} num_species - expects a number of species value from the GET request
     */
    AIV.getWidth = function(num_species) {
        if (num_species > 10 || (num_species >= -1 && num_species <= -2401)){
            return '7';
        } else if (num_species > 5 || (num_species > -2401 && num_species <= -4802)) {
            return '5';
        } else if (num_species > 2 || (num_species > -4802 && num_species <= -7203)) {
            return '3';
        } else if (num_species <= 2 && num_species > 0 || (num_species > -7203 && num_species <= -9605)) {
            return '1';
        } else { //i.e. interlog confidence of '0',
            return '11';
        }
    };

    /**
     * @namespace {object} AIV
     * @function getEdgeColor - return the edge colour if the edge is a PDI/PPI, publish status and interolog confidence/correlation coefficient.
     * @description NOT USED CURRENTLY, chose to use cytoscape selectors instead
     * @param {number} correlation_coefficient
     * @param {boolean} published
     * @param {string} index
     * @param {number} interolog_confidence
     * @returns {string} - hexcode for color
     */
    AIV.getEdgeColor = function(correlation_coefficient, published, index, interolog_confidence) {
        if (published) { //published PPIs but not published PDIs
            return '#99cc00';
        } else if (correlation_coefficient > 0.8) {
            return '#ac070e';
        } else if (correlation_coefficient > 0.7) {
            return '#da4e2f';
        } else if (correlation_coefficient > 0.6) {
            return '#ea801d';
        } else if (correlation_coefficient > 0.5) {
            return '#f5d363';
        } else {
            return '#acadb4';
        }
    };

    /**
     * @namespace {object} AIV
     * @function addNode - generic add nodes to cy core helper function
     * @param {string} node - as the name of the node, i.e. "At3g10000"
     * @param {string} type - as the type of node it is, i.e. "Protein"
     * @param {boolean} [searchGene=false] - optional parameter that signifies node is a search query gene, will be used directly as a true false value into the data properties of the node
     */
    AIV.addNode = function(node, type, searchGene = false) {
        let node_id = type + '_' + node;

        // Add the node
        this.cy.add([
            { group: "nodes", data: {id: node_id, name: node, queryGene : searchGene}} //nodes now have a property 'id' denoted as Protein_At5g20920 (if user inputed 'At5g20920' in the textarea)
        ]);
    };

    /**
     * @function addCompoundNode - generic function to add compound nodes to the cy core
     * @param idOfParent - id of compound node, 'id', example "Nucleus"
     */
    AIV.addCompoundNode = function(idOfParent){
        AIV.cy.add({
            group: "nodes",
            data: {
                id : idOfParent,
                name: idOfParent,
                compoundNode: true, //data property used instead of a class because we cannot select nodes by NOT having a class
            },
        });
    };

    /**
     * @function addLocalizationCompoundNodes - specifically add compound nodes to cy core by going into our localization state variable
     */
    AIV.addLocalizationCompoundNodes = function(){
        for (let i = 0; i < this.locCompoundNodes.length; i++) {
            // console.log(this.locCompoundNodes[i]);
            this.addCompoundNode(this.locCompoundNodes[i]);
        }
        AIV.coseParentNodesOnCyCore = true; // we have added compound nodes, change the state variable
    };

    /**
     * @function removeLocalizationCompoundNodes - Remove compound nodes from cy core so we can make a nicer layout after the users clicks on cose-bilkent layout and then goes back to the spread layout for example.
     */
    AIV.removeLocalizationCompoundNodes = function(){
        if (!this.coseParentNodesOnCyCore){return} // exit if compound nodes not added yet
        this.cy.$('node[!compoundNode]').move({ parent : null }); //remove child nodes from parent nodes before removing parent nodes
        this.cy.$("node[?compoundNode]").remove();
        this.coseParentNodesOnCyCore = false;
    };

    /**
     * @function removeAndAddNodesForCompoundNodes - Unfortuantely cytoscapejs cannot add compound nodes on the fly so we have to remove old nodes and add them back on with a parent property, hence this function
     */
    AIV.removeAndAddNodesForCompoundNodes = function(){
        // console.log("removeAndAddNodesForCompoundNodes 1", this.cy.elements('node[ id ^= "Protein_"]').size());
        let oldEdges = this.cy.elements('edge');
        oldEdges.remove();
        let oldNodes = this.cy.elements('node[ id ^= "Protein_"], node[ id ^= "Effector_"]');
        oldNodes.remove();

        let newNodes = [];

        // the reasoning behind having this style being updated and then removed again in the layout.stop when the cose-bilkent layout is finished is because running the layout with hidden nodes does NOT manuever the nodes around nicely (i.e. they're all in one spot); this is a workaround
        this.cy.style()
            .selector('.filterByReference')
            .style({'display': 'element'})
            .selector('.pearsonfilterEPPI')
            .style({'display': 'element'})
            .selector('.pearsonAndInterologfilterPPPI')
            .style({'display': 'element'})
            .update(); // update the elements in the graph with the new style

        // console.log("removeAndAddNodesForCompoundNodes 2", oldNodes.size());
        oldNodes.forEach(function(oldNode){
            let newData = Object.assign({}, oldNode.data()); // let us make a copy of the previous object not directly mutate it. Hopefully the JS garbage collector will clear the memory "https://stackoverflow.com/questions/37352850/cytoscape-js-delete-node-from-memory"

            let filterClasses = "";
            if (oldNode.hasClass('filterByReference')){filterClasses += "filterByReference";}
            if (oldNode.hasClass('pearsonfilterEPPI')){filterClasses += " pearsonfilterEPPI ";}
            if (oldNode.hasClass('pearsonAndInterologfilterPPPI')){filterClasses += " pearsonAndInterologfilterPPPI";}
            newData.parent = oldNode.data("localization");
            newNodes.push({
                group: "nodes",
                data: newData,
                classes: filterClasses,
            });
        });

        this.cy.add(newNodes);
        oldEdges.restore();
    };

    /**
     * This will add the chromosome nodes (that represent 1+ gene in them) to the cy core
     *
     * @param {object} DNAObject - as the JSON data in object form i.e. {source: .., target:.., index: 2, ..}
     * @param {string} chrNumber - as the chromosomal number i.e. "2" or "M"
     * @param {string} chrName - as the name of the chromsome i.e. "2" or "Mitochondria"
     */
    AIV.addChromosomeToCytoscape = function(DNAObject, chrNumber, chrName) {
        this.cy.add(
            {
                group: "nodes",
                data:
                    {
                        id: "DNA_Chr" + chrNumber,
                        name: "Chr-" + chrName,
                        localization: "nucleus"
                    },
                classes: 'DNA'
            }
        );
    };

    /**
     * @namespace {object} AIV
     * @function addEdges - Add edges to the cy core, need many params here to determine the edgestyling via some of these params
     * @param {string} source - as the source protein i.e. "At2g34970"
     * @param {string} typeSource - as the type of protein it is, i.e. "effector" or "protein"
     * @param {string} target - as the target protein i.e. "At3g05230"
     * @param {string} typeTarget - as the type of protein it is, i.e. "effector" or "protein"
     * @param {number | string} total_hits - as (if it exists) a published string of the DOI or Pubmed, etc. i.e. " "doi:10.1038/msb.2011.66"" or "None"
     * @param {number | string} num_species - to whether this is published interaction data i.e. true
     * @param {number | string} quality  - interolog confidence number, can be negative to positive, or zero (means experimentally validated prediction) i.e. -2121
     * @param {string} databaseSource - where did this edge come from ? i.e. "BAR"
     * @param {number | string | null} R - the correlation coefficient of the coexpression data (microarray)
     */
    AIV.addEdges = function(source, typeSource, target, typeTarget, total_hits, num_species, quality, databaseSource, R) {
        // let edge_id = typeSource + '_' + source + '_' + typeTarget + '_' + target;
        source = typeSource + '_' + source;
        target = typeTarget + '_' + target;
        let edge_id = source + '_' + target;
        this.cy.add([
            {
                group: "edges",
                data:
                {
                    id: edge_id,
                    source: source,
                    target: target,
                    total_hit: total_hits,
                    num_species: num_species,
                    quality: quality,
                    pearsonR: R,
                },
            }
        ]);
    };


    /**
     * @namespace {object} AIV
     * @function resizeEListener - Resize UI listener when app is loaded, i.e. reposition the chr nodes if the browser size changes
     */
    AIV.resizeEListener = function () {
        this.cy.on('resize', this.setDNANodesPosition.bind(AIV));
    };


    /**
     * @namespace {object} AIV
     * @function - addProteinNodeQtips Add qTips (tooltips) to the protein nodes.
     *
     * Note the function definition as the text. This means that this function will be run when hovered
     * Namely we check the state of the AJAX call for that particular protein to decide whether to
     * make another AJAX call or to simply load the previously fetched data
     */
    AIV.addProteinNodeQtips = function() {
        this.cy.on('mouseover', 'node[id^="Protein"]', function(event) {
            let protein = event.target;
            let agiName = protein.data("name");

            let exprOverlayChkbox = document.getElementById('exprnOverlayChkbox');
            protein.qtip(
                {
                    overwrite: false, //make sure tooltip won't be overriden once created
                    content  : {
                                    title :
                                        {
                                            text : "Protein " + agiName,
                                            button: 'Close'
                                        },
                                    text :
                                        function(event, api) {
                                            let HTML = "";
                                            HTML += AIV.showDesc(protein);
                                            HTML += `<p>${AIV.displaySUBA4qTipData(protein)}</p>`;
                                            if (AIV.exprLoadState.absolute && exprOverlayChkbox.checked){;
                                                HTML += `<p>Mean Expr: ${protein.data('absExpMn')}</p>
                                                         <p>SD Expr:   ${protein.data('absExpSd')}</p>`;
                                            }
                                            if (AIV.exprLoadState.relative && exprOverlayChkbox.checked){
                                                HTML += `<p>Log2 Expr: ${protein.data('relExpLog2')}</p>
                                                         <p>Fold Expr: ${protein.data('relExpFold')}</p>`;
                                            }
                                            return HTML;
                                        }
                                },
                    style    : { classes : 'qtip-light qtip-protein-node'},
                    show:
                        {
                            solo : true,
                            event: `${event.type}`, // Use the same show event as triggered event handler
                            ready: true, // Show the tooltip immediately upon creation
                            delay: 300 // Don't hammer the user with tooltips as s/he is scrollin over the graph
                        },
                    hide : false
                }
            );
        });
    };

    /**
     * @function parseProteinNodes - parse through every protein (non-effector) node that exists in the DOM and perform the callback function on each node
     * @param {function} cb -  callback function
     * @param {boolean} [needNodeRef=false] - optional boolean to determine if callback should be performed on node object reference
     */
    AIV.parseProteinNodes = function(cb, needNodeRef=false){
        this.cy.filter("node[id ^= 'Protein']").forEach(function(node){
            let nodeID = node.data('name');
            if (nodeID.match(/^LOC_OS(0[1-9]|1[0-2])G\d{5}$/i)) { //only get AGI IDs, i.e. exclude effectors
                if (needNodeRef){
                    cb(node);
                }
                else{
                    cb(nodeID);
                }
            }
        });
    };

    /**
     * @function showALias - helper function to decide whether or not to show desc on protein qTip
     * @param {object} protein - reference to the particular protein which we are adding a qTip
     * @returns {string} - a nicely formmated HTML string
     */
    AIV.showDesc = function(protein) {
        let desc = protein.data('desc');
        if (!desc){ return ""; } //exit if undefined
        return `<p>Annotation: ${desc}</p>`;
    };

    /**
     * @function showSynonyms - helper function to decide whether or not to show alias on protein qTip
     * @param {object} protein - reference to the particular protein which we are adding a qTip
     * @returns {string} - a nicely formmated HTML string
     */
    AIV.showSynonyms = function(protein) {
        let syns = protein.data('synonyms');
        if (!syns){ return ""; } //exit if undefined
        return `<p>Synoynms: ${syns}</p> <hr>`;
    };

    // /**
    //  * @function showMapMan - helper function to decide whether or not to show MapMan on protein qTip
    //  * @param {object} protein - reference to the particular protein which we are adding a qTip
    //  * @returns {string} - a nicely formmated HTML string of its mapman codes
    //  */
    // AIV.showMapMan = function(protein) {
    //     let mapManNums = protein.data('numOfMapMans');
    //     if (!mapManNums){ return ""; } //exit if undefined
    //     let baseString = "";
    //     for (let i = 1; i < ( mapManNums + 1 ) ; i++) {
    //         baseString += `<p> MapMan Code ${i} : ` + protein.data('MapManCode' + i) + '</p>' + `<p> MapMan Annotation ${i} : ` + protein.data('MapManName' + i) + '</p>';
    //     }
    //     baseString += "<hr>";
    //     // console.log(baseString);
    //     return baseString;
    // };

    /**
     * @function displaySUBA4qTipData - helper function to decide whether or not to show SUBA4 html table on protein qTip, if so it will add a data property to a node such that it will be ready for display via qTip
     * @param {object} protein - reference to the particular protein which we are adding a qTip
     * @returns {string} - a nicely formmated HTML string of a node's localizations in PCT form
     */
    AIV.displaySUBA4qTipData = function(protein) {
        let locData = protein.data('localizationData');
        if (!locData) {return "Localization data unavailable";} //exit if undefined
        let baseString = "";
        for (let i = 0; i < locData.length ;i++){
            let locPercent = Object.values(locData[i])[0];
            if (locPercent > 0) {
                baseString += `<p>${Object.keys(locData[i])[0]}: ${(locPercent*100).toFixed(1)}%</p>`;
            }
        }
        return baseString;
    };

    /**
     * @namespace {object} AIV
     * @function addEffectorNodeQtips - Add qTips (tooltips) to effector nodes, this should simply just show the name when hovered over
     */
    AIV.addEffectorNodeQtips = function() {
        this.cy.on('mouseover', 'node[id^="Effector"]', function(event) {
            var effector = event.target;
            effector.qtip(
                {
                    overwrite: false, //make sure tooltip won't be overriden once created
                    content  : {
                        title :
                            {
                                text : "Effector " + effector.data("name"),
                                button: 'Close'
                            },
                        text: " "
                    },
                    style    : { classes : 'qtip-light qtip-effector-node'},
                    show:
                        {
                            solo : true,
                            event: `${event.type}`, // Use the same show event as triggered event handler
                            ready: true, // Show the tooltip immediately upon creation
                        },
                    hide : false
                }
            );
        });
    };


    /**
     * @namespace {object} AIV
     * @function createPPIEdgeText - decides whether to show the docker link or not based on the interolog confidence (based on whether it is IFF the interolog confidence is negative). Then use the 3 params to create an external link elsewhere on the BAR.
     *
     * @param {string} source - as the source protein in AGI form i.e. "At3g10000"
     * @param {string} target - as the target protein in AGI form i.e. "At4g40000"
     * @param {string} reference - string of DOI or PMIDs, delimited by \n, i.e. "doi:10.1126/science.1203659 \ndoi:10.1126/science.1203877".. whatever came through the GET request via 'reference' prop
     * @param {number|string} interologConf - represents the interolog confidence value of the PPI, can be "NA" if the edge is from INTACT/BioGrid
     */
    AIV.createPPIEdgeText = (source, target, reference, interologConf) => {
        let modifyProString = string => string.replace(/PROTEIN_/gi, '').toUpperCase();

        var refLinks = "";
        if (reference) { //non-falsy value (we may have changed it to false in the addEdges() call)
            AIV.memoizedSanRefIDs( reference ).forEach(function(ref){
                refLinks += '<p> Ref: ' + AIV.memoizedRetRefLink(ref, target, source) + '</p>';
            });
        }

        if (interologConf >= 0 ) {
            return refLinks; //can be "" or have a bunch of links..., "NA" should return ""
        }
        else { //if interlog confidence is less than zero, show external docker link
            return "<p><a href='http://bar.utoronto.ca/protein_docker/?id1=" + modifyProString(source) + "&id2=" + modifyProString(target) + "' target='_blank'> " + "Predicted Structural Interaction " + "</a></p>" + refLinks;
        }
    };


    /**
     * @namespace {object} AIV
     * @function addPPIEdgeQtips - Add qTips (tooltips) to protein protein interaction edges, also adds qTips to protein-effector edges
     */
    AIV.addPPIEdgeQtips = function() {
        let that = this;
        this.cy.on('mouseover', 'edge[source^="Protein"][target^="Protein"], edge[source^="Protein"][target^="Effector"], edge[source^="Effector"][target^="Protein"]', function(event){
            let ppiEdge = event.target;
            let edgeData = ppiEdge.data();
            ppiEdge.qtip(
                {
                    content:
                        {
                            title:
                                {
                                    text: edgeData.source.replace("_", " ") + " to " + edgeData.target.replace("_", " "),
                                    button: "Close"
                                },
                            // text : that.createPPIEdgeText( edgeData.source, edgeData.target, edgeData.reference, edgeData.interologConfidence ) +
                            // (edgeData.interologConfidence >= 1 ? `<p>Interolog Confidence: ${edgeData.interologConfidence}</p>` : "") + //ternary operator return the interolog confidence value only not the SPPI rank
                            // `<p>Correlation Coefficient: ${edgeData.pearsonR} </p>` +
                            // (edgeData.miAnnotated.length > 0 ? `<p>MI Term(s): ${edgeData.miAnnotated.join(', ')} </p>` : ""),
                            text :`<p>Ref: <a href="https://dx.doi.org/10.1186/1939-8433-5-15" target="_blank"> BAR - DOI ${10.1186/1939-8433-5-15} </a> </p>`+
                                `<p>Total hits: ${edgeData.total_hit} </p>` +
                                `<p>Number of species: ${edgeData.num_species} </p>` +
                                `<p>Quality: ${edgeData.quality} </p>` +
                                `<p>Correlation Coefficient: ${edgeData.pearsonR} </p>`,
                        },
                    style  : { classes : 'qtip-light qtip-ppi-edge' },
                    show:
                        {
                            solo : true,
                            event: `${event.type}`, // Use the same show event as triggered event handler
                            delay: 500
                        },
                    hide : false
                }
            );
        });
    };

    /**
     * @namespace {object} AIV
     * @function sanitizeReferenceIDs - Process the pubmed IDs and DOIs that come in from the interactions request. This will return an array of links (as strings). We have to check for empty strings before returning.
     *
     * @param {string} JSONReferenceString - as a string of links delimited by newlines "\n"
     */
    AIV.sanitizeReferenceIDs = function(JSONReferenceString) {
        let returnArray = JSONReferenceString.split("\n");
        returnArray = returnArray.filter(item => item !== '');
        // console.log("sanitized ,", returnArray);
        return returnArray;
    };

    /**
     * @namespace {object} AIV
     * @function memoizedSanRefIDs - memoized version of the sanitizeReferenceIDs pure function for performance
     * @param {Function} AIV.returnReferenceLink - sanitizeReferenceIDs function defintiion
     */
    AIV.memoizedSanRefIDs = _.memoize(AIV.sanitizeReferenceIDs);

    /**
     * @namespace {object} AIV
     * @function returnReferenceLink -
     * This function expects to receive a string which either 'references' a
     * 1) PubMedID (PubMed)
     * 2) MINDID (Membrane based Interacome Network) ** We use AGIIdentifier for this as MIND search query does not go by Id.. **
     * 3) AI-1 ID (Arabidopsis interactome project)
     * 4) DOI reference hotlink
     * 5) BioGrid interaction ID
     * 6) BINDID (Biomolecular Interaction Network Database, NOTE: Not live as of Nov 2017)
     * @param {string} referenceStr - as the link given to the function that could be any the of above or none
     * @param {string} AGIIdentifier - is used for the biodb link (target gene)
     * @param {string} TF - AGI for query/TF gene, used for DAP-Seq link
     * @return {string} - a link from the above list
     */
    AIV.returnReferenceLink = function(referenceStr, AGIIdentifier, TF) {
        console.trace(referenceStr, AGIIdentifier, TF);
        let regexGroup; //this variable necessary to extract parts from the reference string param
        let db = referenceStr.match(/^([A-Z]+)-*/i)[1] + " - ";
        if ( (regexGroup = referenceStr.match(/PubMed[:]?(\d+)$/i)) ) { //assign and evaluate if true immediately
            return `<a href="https://www.ncbi.nlm.nih.gov/pubmed/${regexGroup[1]}" target="_blank"> ${db} PMID ${regexGroup[1]}</a>`;
        }
        else if ( (regexGroup = referenceStr.match(/Mind(\d+)$/i)) ){
            return `<a href="http://biodb.lumc.edu/mind/search_results.php?text=${AGIIdentifier}&SubmitForm=Search&start=0&count=25&search=all" target="_blank"> ${db} MIND ID ${regexGroup[1]}</a>`;
        }
        else if ( (regexGroup = referenceStr.match(/AI-1.*$/i)) ){
            return `<a href="http://interactome.dfci.harvard.edu/A_thaliana/index.php" target="_blank"> ${db} (A. th. Interactome) ${referenceStr} </a>`;
        }
        else if ( (regexGroup = referenceStr.match(/doi:(.*)/i)) ){
            if (regexGroup[0] === "doi:10.1016/j.cell.2016.04.038"){
                console.log(regexGroup, AGIIdentifier, TF);
                return `<a href="//bar.utoronto.ca/DAP-Seq-API?target=${AGIIdentifier}&tf=${TF}" target="_blank"> DAP-Seq (O'Malley 2016)</a>`
            }
            return `<a href="http://dx.doi.org/${regexGroup[1]}" target="_blank"> ${db} DOI ${regexGroup[1]} </a>`;
        }
        else if ( (regexGroup = referenceStr.match(/biogrid:(.*)/i)) ){
            return `<a href="https://thebiogrid.org/interaction/${regexGroup[1]}" target="_blank"> ${db} BioGrid ${regexGroup[1]}</a>`;
        }
        else if ( (regexGroup = referenceStr.match(/(\d+)/)) ) { //for BIND database (now closed)
            return `<a href="https://academic.oup.com/nar/article/29/1/242/1116175" target="_blank"> ${db} BIND ID ${referenceStr}</a>`;
        }
    };

    /**
     * @namespace {object} AIV
     * @function memoizedRetRefLink - memoized version of the returnReferenceLink pure function for performance
     * @param {Function} AIV.returnReferenceLink - returnReferenceLink function defintiion
     */
    AIV.memoizedRetRefLink = _.memoize(AIV.returnReferenceLink, function(){
        if (arguments[0] === "doi:10.1016/j.cell.2016.04.038"){ // TODO: change this to PMID of dap-seq paper
            return JSON.stringify(arguments)
        }
        else {
            return JSON.stringify(arguments[0])
        }
    });

    /**
     * @namespace {object} AIV
     * @function parseBARInteractionsData -
     * This function parses interactions for the BAR interactions API data, namely in these ways:
     * Create an outer for loop (run N times where N is the # of genes in the user form):
     * I  ) Assign dataSubset variable to be all the genes connected to a single form gene
     * II ) Then create an inner for loop to add the interacting nodes:
     * i  ) Add interactive node to the cy core.
     * ii ) Add the edges for all interactions
     * iia) Make sure not to double add edges and double add nodes
     * iib) Get the line styles, width and colours as well based on parameters such as correlation
     *      coefficient and interolog confidence that were returned in the request
     * iii) Filter based on the edges such to sort PDI and PPIs.
     * iv ) After all this is finished, we run a bunch of functions that add qTips and Styling
     * @param {object} data - response JSON we get from the get_interactions_dapseq PHP webservice at the BAR
     */
    AIV.parseBARInteractionsData = function(data) {
        let publicationsPPIArr = []; //local variable to store all unique publications that came from the JSON
        for (let geneQuery of Object.keys(data)) {



            let dataSubset = data[geneQuery]; //'[]' expression to access an object property


            // Add Nodes for each query
            for (let i = 0; i < dataSubset.length; i++) {
                let typeSource = '';
                let typeTarget = '';
                let width = '5'; // Default edge width
                let edgeData = dataSubset[i]; // Data from the PHP API comes in the form of an array of PPIs/PDIs hence this variable name
                let dbSrc = "BAR";




                // let {index, source, target, reference, published, interolog_confidence, correlation_coefficient, mi} = edgeData;////
                // let {source, target, total_hits, num_species, quality, correlation_coefficient} = edgeData;
                let source = edgeData["protein_1"];
                let target = edgeData["protein_2"];
                let total_hits = edgeData["total_hits"];
                let num_species = edgeData["Num_species"];
                let quality = edgeData["Quality"];
                let correlation_coefficient = edgeData["pcc"];



                // Source, note that source is NEVER DNA
                if (source.match(/^LOC_OS(0[1-9]|1[0-2])G\d{5}$/i)) {
                    typeSource = 'Protein';
                } else {
                    typeSource = 'Effector';
                }

                // Target
                if (target.match(/^LOC_OS(0[1-9]|1[0-2])G\d{5}$/i)) {
                    typeTarget = 'Protein';
                } else {
                    typeTarget = 'Effector';
                }

                if ( AIV.cy.getElementById(`${typeSource}_${source}`).empty()) { //only add source node if not already on app, recall our ids follow the format Protein_At2g10000
                    this.addNode(source, typeSource);
                }
                if ( AIV.cy.getElementById(`${typeTarget}_${target}`).empty()) {
                    this.addNode(target, typeTarget);
                }

                let edgeSelector = `${typeSource}_${source}_${typeTarget}_${target}`;
                if ( AIV.cy.$id(edgeSelector).empty() ) { //Check if edge already added from perhaps the PSICQUIC webservices
                    this.addEdges(source, typeSource, target, typeTarget, total_hits, num_species, quality, dbSrc, correlation_coefficient);
                }
                else {
                    AIV.cy.$id(edgeSelector).data({
                        total_hits: total_hits,
                        num_species: num_species,
                        quality: quality,
                        pearsonR : correlation_coefficient,
                    });
                }
            }
        } //end of adding nodes and edges

        let filteredPubsArr = [].concat.apply([], publicationsPPIArr.map(function (innerArr) {
            return innerArr.split('\n').filter(function (item) {
                // if we have MIND/BIOGRID/BIND identifiers, filter them out as they're not really references for building our dropdown list
                if (!item.match(/biogrid:(.*)/i) && !item.match(/Mind(\d+)$/i) && !item.match(/^(\d+)$/i)){
                    return item;
                }
            });
        }));
        let uniquefilteredPubsArr = Array.from(new Set(filteredPubsArr)); // remove duplicates
        this.buildRefDropdown(uniquefilteredPubsArr);

        /**
         * @function scientificToDecimal - Helper function to turn scientific notation nums to integer form more nicely than using toFixed(), credits to https://gist.github.com/jiggzson/b5f489af9ad931e3d186
         * @param num - number
         * @return num - in integer form if num was originally in scientific notation
         */
        function scientificToDecimal(num) {
            //if the number is in scientific notation remove it
            if(/\d+\.?\d*e[\+\-]*\d+/i.test(num)) {
                let zero = '0',
                    parts = String(num).toLowerCase().split('e'), //split into coeff and exponent
                    e = parts.pop(),//store the exponential part
                    l = Math.abs(e), //get the number of zeros
                    sign = e/l,
                    coeff_array = parts[0].split('.');
                if(sign === -1) {
                    num = zero + '.' + new Array(l).join(zero) + coeff_array.join('');
                }
                else {
                    let dec = coeff_array[1];
                    if(dec) { l = l - dec.length }
                    num = coeff_array.join('') + new Array(l+1).join(zero);
                }
            }

            return num;
        }
    };

    /**
     * @namespace {object} AIV
     * @function buildRefDropdown - helper function that will build the dynamic reference dropdown, take in an array of PPI ref strings
     * @param arrayOfPubs - an array of publications for ex, ["None", "PubMed19095804", ...]
     */
    AIV.buildRefDropdown = function(arrayOfPubs){
        let tempArrPubs = arrayOfPubs;
        let whereNoneIs = tempArrPubs.indexOf('None');
        if (whereNoneIs !== -1){ //remove "None" from our list of publications...
            tempArrPubs.splice(whereNoneIs, 1);
        }
        let inputsLabelsHTML = "";
        tempArrPubs.forEach(function(ref){
            if (! document.getElementById(`${ref}-checkbox`)){ // check if DOM node exists before appending
                let bindIDText = "";
                if (ref.match(/^\d+$/)){
                    bindIDText = "BIND ID ";
                }
                inputsLabelsHTML +=
                    `
                    <label for="${ref}-checkbox">
                        <input type="checkbox" id="${ref}-checkbox" class="ref-checkbox" value="${ref}" checked>
                        ${bindIDText + ref}
                    </label>
                    `;
            }
        });
        $('#refCheckboxes').append(inputsLabelsHTML);
    };

    /**
     * @namespace {object} AIV
     * @function - parsePSICQUICInteractionsData - Take in non-BAR PSICQUICdata param which is the text response we get back from the AJAX call and parse it via regex (based on whether it is from INTACT or BioGrid). Then add unique edges and nodes. NOTE: PSICQUIC data can have more than one entry/evidence for a single edge (resulting in multiple lines for single the interacting protein)
     * @param {string} PSICQUICdata - should be a bunch of PSICQUIC formatted text
     * @param {string} queryGeneAsAGI - should be something like "At3g10000"
     * @param {string} INTACTorBioGrid - should either be "INTACT" or "BioGrid"
     */
    AIV.parsePSICQUICInteractionsData = function(PSICQUICdata, queryGeneAsAGI, INTACTorBioGrid){
        // INTACT and BioGrid PPIs are experimentally validated by default hence these 3 colors, style, width

        let regex;
        if (INTACTorBioGrid === "INTACT") {
            // example uniprotkb:(?!At3g18130)(At\d[gcm]\d{5})\(locus.*psi-mi:"MI:(\d+"\(.*?\)).*(pubmed:\d+) WITH GI flags!
            regex = new RegExp("uniprotkb:(?!" + queryGeneAsAGI +")(At\\d[gcm]\\d{5})\\(locus.*psi-mi:\"MI:(\\d+\"\\(.*?\\)).*(pubmed:\\d+)", "gi");
        }
        else if (INTACTorBioGrid === "BioGrid"){
            // example \|entrez gene\/locuslink:(?!At3g18130)(At\d[gcm]\d{5})[\t|].*psi-mi:"MI:(\d+"\(.*?\)).*(pubmed:\d+) WITH GI flags!
            regex = new RegExp("\\|entrez gene\\/locuslink:(?!" + queryGeneAsAGI + ")(At\\d[gcm]\\d{5})[\\t|].*psi-mi:\"MI:(\\d+\"\\(.*?\\)).*(pubmed:\\d+)", "gi");
        }

        let match;
        let arrPPIsProteinsRaw = []; // array will be populated with ABI identifiers of genes that interact with the queryGeneAsAGI via regex...
        let miTermPSICQUIC = []; // array to be populated with MI terms with their annotations i.e. ['0018"(two hybrid)', ...]
        let pubmedIdArr = []; // array to store string of pubmed IDs

        /*
        Do not place the regular expression literal (or RegExp constructor) within the while condition or it will create an infinite loop if there is a match due to the lastIndex
        property being reset upon each iteration. Also be sure that the global flag is set or a loop will occur here also.

        We are looping through the entire returned response text string (tab delimited PSICQUIC format) and looking for matches via the builtin regex.exec method. When we find a match, specifically
        the second capturing group, we will push to a state array for further processing
         */
        while ((match = regex.exec(PSICQUICdata)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            arrPPIsProteinsRaw.push( AIV.formatAGI ( match[1] ) ); // 1st captured group, i.e. "At2g10000"
            miTermPSICQUIC.push(match[2]); // push the 2nd group (i.e '0018"(two hybrid)', yes with '"'!)
            pubmedIdArr.push(match[3]); //look for third captured group (i.e. "23667124")
        }

        /*
        Loop through each PPI interaction and add the corresponding edge
        Need index to add PubMedID (as far as we know there is only one pubmed ID per interaction) so we can simply map out the index.
        Note we check if an edge already exists as there seems to be rarely a duplicate in the PSICQUIC response data
         */
        arrPPIsProteinsRaw.forEach(function(proteinItem, index){
            if ( AIV.cy.$id(`Protein_${proteinItem}`).empty()) { //Check if node already on cy core (don't need to do an array check as form nodes added in the then() after the Promise.all)
                AIV.addNode(proteinItem, "Protein");
            }

            let edgeSelector = `Protein_${queryGeneAsAGI}_Protein_${proteinItem}`;
            let preappendedRef = INTACTorBioGrid + "-" + pubmedIdArr[index];
            miTermPSICQUIC[index] = miTermPSICQUIC[index].replace('"', ' '); // replace for " inside '0018"(two hybrid)' to become '0018 (two hybrid)'
            if ( AIV.cy.$id(edgeSelector).empty() ) { //Check if edge already added from BAR
                    AIV.addEdges( queryGeneAsAGI, "Protein", proteinItem, "Protein", preappendedRef, true, 0, INTACTorBioGrid, null, miTermPSICQUIC[index] ); // 0 represents experimentally validated in our case and we leave R as null
            }
            else { // account for edges already added, we just have to edit some edge data (refs and miTERMs)
                let updatedRefData = AIV.cy.$id(edgeSelector).data('reference') + '\n' + preappendedRef;
                AIV.cy.$id(edgeSelector).data({
                    'reference': updatedRefData,
                    'published': true, // Note that we DON'T change the interolog confidence since the BAR actually has such data
                    'miAnnotated': AIV.cy.$id(edgeSelector).data('miAnnotated').concat([miTermPSICQUIC[index]]) // append new miTerm to current arr
                });
            }
        });

        let pubmedIdArrUnique = pubmedIdArr.filter(function(item, index, selfArr){ // delete duplicates
            return index === selfArr.indexOf(item);
        });
        this.buildRefDropdown(pubmedIdArrUnique);

    };

    /**
     * @function addTableRow - take in a bunch of params and add it to an HTML table row string, to be held in a state variable
     * @description - NO LONGER USED, here for reference as it was a base for the createTableFromEdges function
     * @param {string} intType - interaction type, protein-protein or protein-dna
     * @param {string} dbSource - database source, ex BAR
     * @param {string} sourceGene - AGI source gene
     * @param {string} targetGene - AGI target gene
     * @param {number|string} interoConf - interologconfidence, if it exists
     * @param {number|string} pearsonCC - pearson correlation coefficient
     * @param {string} ref - if a published interaction, pubmed or DOI or MIND etc
     * @param miTerm - MI term that describes what type of a experiment was performed
     */
    AIV.addTableRow = function(intType, dbSource, sourceGene, targetGene, interoConf, pearsonCC, ref, miTerm){
        //store in a state variable for performance boot rather than adding one row at a time to DOM

        /**
         * Some notes:
         * For interlog confidence it represents multiple things: FEMO score, interolog confidence, SPPI rank and experimentally determined
         * Talked with nick to represent '0' (experimentally determined) as 'N/A' hence the ternary operator
         * Parse mi terms for BAR/INTACT/BioGrid, then format nicely if more than one mi term
         * Also need a 'ppiOrPdi' to make ppis and pdis distinct for localization cells
         */
        let ppiOrPdi = "ppi";
        if (intType === "protein-DNA"){ ppiOrPdi = "pdi";}

        let referencesCleaned = "";
        this.memoizedSanRefIDs(ref).forEach(function(ref){
            referencesCleaned += `<p> ${AIV.memoizedRetRefLink(ref, targetGene, sourceGene)} </p>`;
        });

        let miFormattedHTML = "";
        if (miTerm !== null && miTerm !== undefined && dbSource === "BAR"){
            let miArray = miTerm.split('|');
            miArray.forEach(function(miTerm){
                if (AIV.miTerms[miTerm] !== undefined){
                    miFormattedHTML += `<p>${miTerm} (${AIV.miTerms[miTerm]})</p>`;
                }
            });
        }
        else if (dbSource === "INTACT" || dbSource === "BioGrid") {
            miFormattedHTML += `<p>${miTerm}</p>`;
        }

        this.tempHtmlTableStr +=
            `<tr>
                <td class="small-csv-column">${intType}</td>
                <td class="small-csv-column">${sourceGene}</td>
                <td class="small-csv-column">${targetGene}</td>
                <td class="${sourceGene}-annotate small-csv-column"></td>
                <td class="${targetGene}-annotate small-csv-column"></td>
                <td class="small-csv-column">${interoConf === 0 ? "N/A" : interoConf }</td>
                <td class="small-csv-column">${pearsonCC}</td>
                <td class="lg-csv-column">${referencesCleaned.match(/.*undefined.*/) ? "None" : referencesCleaned}</td>
                <td class="med-csv-column">${miFormattedHTML ? miFormattedHTML : "None"}</td>
                <td class="${sourceGene}-loc lg-csv-column">Fetching Data</td>
                <td class="${targetGene}-${ppiOrPdi}-loc lg-csv-column">${ppiOrPdi === "pdi" ? "Nucleus(assumed)" : "Fetching Data"}</td>
            </tr>`;
    };

    /**
     * @function createTableFromEdges - this funciton will scan through our recently added Cy PPI edges and then our state variable of chromosomes to build a neat HTML table to be appended to the #csvTable modal
     */
    AIV.createTableFromEdges = function (){
        let htmlString = "";

        // process PPI edges first
        this.cy.edges('[target *= "Protein"]').forEach(function(ppiEdge){
            let tempData = ppiEdge.data();

            let cleanRefs = "";
            let sourceGene = tempData.source.split(/_(.+)/)[1];
            let [typeTarget, targetGene] = tempData.target.split(/_(.+)/);
            if (tempData.reference){ //non-falsy value
                AIV.memoizedSanRefIDs(tempData.reference).forEach(function(ref){
                    cleanRefs += `<p> ${AIV.memoizedRetRefLink(ref, targetGene, sourceGene)} </p>`;
                });
            }else{
                cleanRefs = `<p><a href="https://dx.doi.org/10.1186/1939-8433-5-15" target="_blank"> BAR - DOI ${10.1186/1939-8433-5-15} </a> </p>`;
            }

            htmlString +=
                `<tr>
                    <td class="small-csv-column">Protein-${typeTarget}</td>
                    <td class="med-csv-column">${sourceGene}</td>
                    <td class="med-csv-column">${targetGene}</td>
                    <td class="${sourceGene}-annotate small-csv-column"></td>
                    <td class="${targetGene}-annotate small-csv-column"></td>
                    <td class="small-csv-column">${tempData.num_species === 0 ? "N/A" : tempData.num_species }</td>
                    <td class="small-csv-column">${tempData.pearsonR}</td>
                    <td class="lg-csv-column">${cleanRefs.match(/.*undefined.*/) ? "None" : cleanRefs}</td>
                    <td class="${sourceGene}-loc lg-csv-column">Fetching Data</td>
                    <td class="${targetGene}-ppi-loc lg-csv-column">Fetching Data</td>
                </tr>`;
        });

        $('#csvTable').find("tbody").append(htmlString);
    };

    /**
     * @namespace {object} AIV
     * @function returnLocalizationPOSTJSON - Create and return SUBA URL string for AJAX call
     * @returns {Object} - an object with the string of AGIs and the predicted localizations
     */
    AIV.returnLocalizationPOSTJSON = function(){

        var reqJSON =
            {
                species: 'rice',
                genes : [],
            };
        this.parseProteinNodes(nodeID => reqJSON.genes.push( nodeID.concat('.1') ));



        return reqJSON;
    };

    /**
     * @namespace {object} AIV
     * @function addLocalizationDataToNodes -
     * Run a forEach loop for every node with a valid ABI ID to attach SUBA data to the node to be later
     * shown via pie-chart background (built-in in cytoscapejs).
     * We chose to hard-code the cellular localizations versus checking them in the JSON structure as
     * the JSON structure does not return all cellular localizations when it does not have a score.
     * Also note that some of the property names had spaces in them...
     *
     * @param {object} SUBADATA as the response JSON we get from our SUBA4 backend (at the BAR)
     */
    AIV.addLocalizationDataToNodes = function(SUBADATA) {
        AIV.cy.startBatch();

        AIV.locCompoundNodes = [];



        let geneLocalizations = SUBADATA["data"];


        Object.keys(geneLocalizations).forEach(function(geneAGIName){
            let nodeID = geneAGIName.slice(0,-2); //remove .1 at the end
            let localization = geneLocalizations[geneAGIName][0].split(",");
            if (localization.length){ //For nodes with any localization data
                let majorityLoc = localization[0];


                AIV.cy.$('node[name = "' + nodeID + '"]')
                    .data({
                        predictedSUBA : true,
                        experimentalSUBA : false,
                        localizationData: calcLocPcts(localization),
                        localization : majorityLoc, //assign localization to highest loc score
                    });
                if (AIV.locCompoundNodes.indexOf(majorityLoc) === -1 ){
                    AIV.locCompoundNodes.push(majorityLoc); // append to our state variable which stores unique majority localizations, used to later make compound nodes
                }
            }
            else { //For nodes without any localization data
                AIV.cy.$('node[name = "' + nodeID + '"]')
                    .data({
                        predictedSUBA : false,
                        experimentalSUBA : false,
                        localizationData: [],
                        localization: "unknown"
                    });
                if (AIV.locCompoundNodes.indexOf("unknown") === -1 ){
                    AIV.locCompoundNodes.push("unknown"); // append to our state variable which stores unique majority localizations, used to later make compound nodes
                }
            }

        });

        AIV.cy.endBatch();

        function calcLocPcts(localization){
            let retObj = [];

            localization.forEach(function(loc){
                retObj.push({[loc]: 1/localization.length});
            });
            return retObj;
        }
    };

    /**
     * @namespace {object} AIV
     * @function createSVGPIeDonutCartStr -
     * This function will take in all the location data properties that a node has (for example, 'Nucleus')
     * to be used to create a SVG donut string which will be set as the background image. I intentionally
     * made this function based on the AIV.nodeSize property such that it can be more scalable (literally
     * and figuratively).
     *
     * @param {object} AGIGene - takes in a reference to a node, particularly a ABI gene to parse through its 'PCT' properties.
     *
     * Credits to: https://medium.com/@heyoka/scratch-made-svg-donut-pie-charts-in-html5-2c587e935d72
     */
    AIV.createSVGPieDonutCartStr = function(AGIGene) {
        let nodeData = AGIGene.data();
        let AGIGeneLocData = nodeData.localizationData ;
        let cyNodeSize = nodeData.queryGene ? this.searchNodeSize : this.nodeSize ;
        let SVGwidthheight = cyNodeSize + 10;
        let donutCxCy = SVGwidthheight/2;
        let radius, strokeWidth;
        radius = strokeWidth = cyNodeSize/2;
        let SVGstr = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>';
        SVGstr += `<svg width="${SVGwidthheight}" height="${SVGwidthheight}" class="donut" xmlns="http://www.w3.org/2000/svg">`;
        SVGstr += `<circle class="donut-hole" cx="${donutCxCy}" cy="${donutCxCy}" r="${radius}" fill="transparent"></circle>`;


        //The below donut segment will appear for genes without SUBA data... it will be all grey
        SVGstr += `<circle class="donut-unfilled-ring" cx="${donutCxCy}" cy="${donutCxCy}" r="${radius}" fill="transparent" stroke="#56595b" stroke-width="${strokeWidth}" display="block"></circle>`;


        // Figure out which 'PCT' properties are greater than zero and then programatically add them
        // as donut-segments. Note that some calculations are involved based
        // on the set node size (the example given on the tutorial is based on a 100px C and 15.91 radius)
        var scaling = radius/15.91549430918952;
        var pctAndColorArray = [];

        if (AGIGeneLocData != null && AGIGeneLocData.length > 0){ // need check as nodes without loc data with crash app
            AGIGeneLocData.forEach(function(locPercentage) {
                pctAndColorArray.push({
                    pct : (Object.values(locPercentage)[0] * 100), //convert to % for easier parsing later
                    color : AIV.locColorAssignments[Object.keys(locPercentage)[0]]
                });
            });
        }

        // Now have pre-sorted pctAndColorArray based on the value of the 'pct' property, order greatest to least
        // Result: Show pie chart values from greatest to least starting from 12 oclock

        var initialOffset = 25 * scaling; // Bypass default donut parts start at 3 o'clock instead of 12
        var allSegsLength = 0;

        // Based on the sorted array we created above, let's add some 'donut segments' to the SVG string
        pctAndColorArray.forEach(function(pctAndColor){
            SVGstr += `<circle class="donut-segment" cx="${donutCxCy}" cy="${donutCxCy}" r="${radius}"  fill="transparent" stroke="${pctAndColor.color}" stroke-width="${strokeWidth}" stroke-dasharray="${pctAndColor.pct * scaling} ${(100 - pctAndColor.pct) * scaling}" stroke-dashoffset="${initialOffset}" display="block"></circle>`;

            allSegsLength += pctAndColor.pct;

            // (Circumference − All preceding segments’ total length + First segment’s offset = Current segment offset ) * scaling factor
            initialOffset = (100 - allSegsLength + 25) * scaling; // increase offset as we have just added a slice

        });

        SVGstr += '</svg>';
        SVGstr = 'data:image/svg+xml;utf8,' + encodeURIComponent(SVGstr); // Modify for CSS via cytoscape
        AGIGene.data('svgDonut', SVGstr); // Last, properly mutate the node with our made SVG string

    };

    /**
     * @namespace {object} AIV
     * @function returnBGImageSVGasCSS -
     * Return svg backgrounds as background images to all the protein nodes in the cy core
     * and add borders for those nodes which have experimental SUBA values
     * @returns {object} - a AIV css style update object ( not ran yet, it runs with update() )
     */
    AIV.returnBGImageSVGasCSS = function () {
        return (
            AIV.cy.style() //specifying style instead of stylesheet updates instead of replaces the cy CSS
                .selector('node[id ^= "Protein"]')
                    .css({
                        'background-image' : 'data(svgDonut)',
                    })
                .selector('node[?experimentalSUBA]') //select nodes such that experimentalSUBA is truthy
                    .css({
                        'border-style' : 'solid',
                        'border-width' : '3px',
                        'border-color' : '#99cc00',
                    })
        );
    };

    /**
     * @function transferLocDataToTable - parse every protein and effector node on the DOM and modify the 'csv' table accordingly (add an unordered list of localization percentage scores)
     */
    AIV.transferLocDataToTable = function() {
        this.parseProteinNodes(function(node){
            let ulString = "<ul>";
            let locData = node.data('localizationData');
            try{for (let i = 0; i < locData.length; i++) {
                let locPercent = Object.values(locData[i])[0];
                if (locPercent > 0){
                    ulString += `<li> ${Object.keys(locData[i])[0]}: ${(locPercent*100).toFixed(1)}% </li>`;
                }
            }} catch(error){
                alertify.logPosition("top right");
                alertify.error(`Localization data unavailable for protein ${node.data('name')}`);
            }

            ulString += "</ul>";
            // console.log(ulString);
            let nodeID = node.data('name');
            $(`.${nodeID}-loc`).html(ulString);
            $(`.${nodeID}-ppi-loc`).html(ulString); //only change ppis, pdis are assumed to be nuclear
        }, true);

        this.cy.filter("node[id ^= 'Effector']").forEach(function(effector){
            $(`.${effector.data('name')}-ppi-loc`).text("Extracellular(assumed)");
        });
    };

    /**
     * @namespace {object} AIV
     * @function hideDonuts - un/hides donuts by changing display attribute inside the svg
     * @param {boolean} hide - boolean to determine if we are hiding or not
     */
    AIV.hideDonuts = function(hide) {
        this.cy.startBatch();
        this.cy.$('node[?svgDonut]').forEach(function(node){ //check for nodes with an SVG donut
            let newSVGString = decodeURIComponent(node.data('svgDonut'));
            newSVGString = newSVGString.replace('data:image/svg+xml;utf8,', "");
            if (hide){
                newSVGString = newSVGString.replace(/"block"/g, '"none"'); //change display attribute
            }
            else {
                newSVGString = newSVGString.replace(/"none"/g, '"block"');
            }
            newSVGString = 'data:image/svg+xml;utf8,' + encodeURIComponent(newSVGString);
            node.data('svgDonut', newSVGString);
        });
        this.cy.endBatch();
    };


    /**
     * @namespace {object} AIV
     * @function effectorsLocHouseCleaning - purpose of this function is to fill in the localization data for effectors as they do not undergo the same parsing as protein nodes. Specifically they belong to the Extracellular matrix (ECM), so if one exists on the app, modify the compound state variable correctly if not added already
     */
    AIV.effectorsLocHouseCleaning = function(){
        let effectorSelector = this.cy.filter("node[id ^= 'Effector']");
        if (effectorSelector.length > 0){
            if (this.locCompoundNodes.indexOf('extracellular') === -1){
                this.locCompoundNodes.push("extracellular");
            }
            effectorSelector.forEach(function(effector){ //put effectors in ECM
                effector.data('localization' , 'extracellular');
            });
        }
    };

    /**
     * @namespace {object} AIV
     * @function loadData - Load data main function
     * @returns {boolean} - True if the data is loaded
     */
    AIV.loadData = function() {

        // Dynamically build an array of promises for the Promise.all call later
        var promisesArr = [];

        if ($('#queryBAR').is(':checked')) {
            promisesArr.push(this.createBARAjaxPromise());
        }
        // // if ($('#queryIntAct').is(':checked')) {
        // //     promisesArr = promisesArr.concat(this.createINTACTAjaxPromise());
        // // }
        // // if ($('#queryBioGrid').is(':checked')) {
        // //     promisesArr = promisesArr.concat(this.createBioGridAjaxPromise());
        // // }
        //


        Promise.all(promisesArr)
            .then(function(promiseRes) {
                // console.log("Response:", promiseRes);
                // Add Query node (user inputed in HTML form)
                for (let i = 0; i < AIV.genesList.length; i++) {
                    if (AIV.genesList[i].match(/^LOC_OS(0[1-9]|1[0-2])G\d{5}$/i)) {
                        AIV.addNode(AIV.genesList[i], 'Protein', true);
                    }
                    else {
                        AIV.addNode(AIV.genesList[i], 'Effector', true);
                    }
                }

                // Parse data and make cy elements object
                for (let i = 0; i < promiseRes.length; i++) {
                    if (promiseRes[i].ajaxCallType === "BAR"){
                        AIV.parseBARInteractionsData(promiseRes[i].res);
                    }
                    else {
                        AIV.parsePSICQUICInteractionsData(promiseRes[i].res, promiseRes[i].queryGene, promiseRes[i].ajaxCallType);
                    }
                }

                // Update styling and add qTips as nodes have now been added to the cy core

                AIV.createTableFromEdges();
                // AIV.addInteractionRowsToDOM();
                // console.log(AIV.cy.nodes().length, 'nodes');
                // console.log(AIV.cy.edges().length, 'edges');
                //Below lines are to push to a temp array to make a POST for gene summaries
                let nodeAgiNames = [];
                AIV.parseProteinNodes((nodeID) => nodeAgiNames.push(nodeID));
                let uniqueNodeAgiNames = Array.from(new Set(nodeAgiNames)); // remove duplicates to make quicker requests
                AIV.fetchGeneAnnoForTable(uniqueNodeAgiNames);
                AIV.addProteinNodeQtips();
                AIV.addPPIEdgeQtips();
                AIV.cy.style(AIV.getCyStyle()).update();
                // AIV.resizeEListener();
                AIV.addContextMenus();
                AIV.cy.layout(AIV.getCySpreadLayout()).run();

                $('#refCheckboxes').prepend(
                    "<label for='allCheck'><input type='checkbox' id='allCheck'> Filter All/Reset</label>"
                );
                AIV.filterAllElistener(AIV);

                document.getElementById('loading').classList.add('loaded'); //hide loading spinner
                $('#loading').children().remove(); //delete the loading spinner divs


            })
            .catch(function(err){
                alertify.logPosition("top right");
                alertify.error(`Error during fetching interaction data, try BAR if using PSICQUIC services, status code: ${err.status}`);
            })
            .then(AIV.returnSVGandMapManThenChain);
    };

    /**
     * @function returnSVGandMapManThenChain - Return a promise chain that makes two ajax calls to our SUBA4 localziation API and the MapMan API to draw the SVG piechart background-images. This chain contains some logic with the load state. This logic is for when the user selects the switch for 'predicted' localization data. Note that this implementation will make re-calls to the SUBA4 API when the user hits the switch (as opposed to saving the predicted and experimental data to memory).
     * @return {Promise.<TResult>}
     */
    AIV.returnSVGandMapManThenChain = function () {
        return $.ajax({
            url: 'https://bar.utoronto.ca/api_dev/loc/',
            type: "POST",
            data: JSON.stringify( AIV.returnLocalizationPOSTJSON() ),
            contentType : 'application/json',
            dataType: 'json'
        })
            .then(function(SUBAJSON){
                AIV.addLocalizationDataToNodes(SUBAJSON);

                //Loop through ATG protein nodes and add a SVG string property for bg-image css
                AIV.cy.startBatch();
                AIV.parseProteinNodes(AIV.createSVGPieDonutCartStr.bind(AIV), true);
                AIV.cy.endBatch();
                if (!AIV.SUBA4LoadState){
                    AIV.returnBGImageSVGasCSS().update();
                }

                //Update the HTML table with our SUBA data
                AIV.transferLocDataToTable();
                AIV.SUBA4LoadState = true;
            })
            .catch(function(err){
                alertify.logPosition("top right");
                alertify.error(`Error made when requesting to SUBA webservice, status code: ${err.status}`);
            })
    };

    /**
     * @function createBARAJaxPromise - programatically figures out how to build the BAR URL get request
     * @returns {Promise.<{res: object, ajaxCallType: string}>|*}
     */
    AIV.createBARAjaxPromise = function() {
        //AGI IDs
        var postObj =
            {
                species: 'rice',
                genes : [],
            };
        for (var i = 0; i < this.genesList.length; i++) {
            postObj.genes.push(this.genesList[i]);
        }
        // postObj.genes = postObj.genes.slice(0, -1);


        // //Recursive
        // postObj.recursive = $('#recursive').is(':checked');

        // // Published
        // postObj.published = $('#published').is(':checked');

        // let serviceURL = '//bar.utoronto.ca/interactions2/cgi-bin/get_interactions_dapseq.php';////
        let serviceURL = 'https://bar.utoronto.ca/api_dev/interactions/';


        return $.ajax({
            url: serviceURL,
            type: 'POST',
            data: JSON.stringify(postObj),
            contentType: "application/json",
            dataType: "json"
        })
            .then( res => ( {res: res, ajaxCallType: 'BAR'} )); //ajaxCallType for identifying when parsing Promise.all response array
    };

    /**
     * @function createINTACTAjaxPromise - Parse through the gene form and create a bunch of AJAX requests to the INTACT PSICQUIC webservice
     * @returns {Array} - array of ajax promises that return objects when resolved
     */
    AIV.createINTACTAjaxPromise = function () {
        var returnArr = []; //return an array of AJAX promises to be concatenated later
        for (let i = 0; i < this.genesList.length; i++) {
            returnArr.push(
                $.ajax({
                    url: `//bar.utoronto.ca/interactions2/cgi-bin/psicquic_intact_proxy.php?request=${this.genesList[i]}`,
                    type: 'GET',
                    dataType: 'text'
                })
                    .then( res => ( {res: res, ajaxCallType: 'INTACT', queryGene: this.genesList[i]} )) //ajaxCallType for identifying when parsing Promise.all response array
            );
        }
        return returnArr;
    };

    /**
     * @function createINTACTAjaxPromise - Parse through the gene form and create a bunch of AJAX requests to the BioGrid PSICQUIC webservice
     * @returns {Array} - array of ajax promises that return objects when resolved
     */
    AIV.createBioGridAjaxPromise = function () {
        var returnArr = []; //return an array of AJAX promises to be concatenated later
        for (let i = 0; i < this.genesList.length; i++) {
            returnArr.push(
                $.ajax({
                    url: `//bar.utoronto.ca/interactions2/cgi-bin/psicquic_biogrid_proxy.php?request=${this.genesList[i]}`,
                    type: 'GET',
                    dataType: 'text'
                })
                    .then( res => ( {res: res, ajaxCallType: 'BioGrid', queryGene: this.genesList[i]} )) //ajaxCallType for identifying when parsing Promise.all response array
            );
        }
        return returnArr;
    };

    /**
     * @function fetchGeneAnnoForTable - Take an array of AGIs and perform an ajax call to get gene summaries... then modify the DOM directly
     * @param ABIsArr
     */
    AIV.fetchGeneAnnoForTable = function(ABIsArr) {
        // console.log(ABIsArr);
        this.createGeneSummariesAjaxPromise(ABIsArr)
            .then(res => {
                res["data"].forEach(function(geneAnno){
                    let gene = geneAnno["gene"]
                    let desc = geneAnno["annotation"].slice(8)
                    let selector = AIV.cy.$(`#Protein_${gene}`);
                    $(`.${gene}-annotate`).text(`${desc}`);
                    selector.data({
                        'annotatedName': selector.data('name'),
                        'desc': desc,
                    });
                });
                this.returnGeneNameCSS().update();
            })
            .catch(err => {
                alertify.logPosition("top right");
                alertify.error(`Error in gene summary fetching, ${err}`);
            });
    };

    /**
     * @function returnGeneNameCSS - return a style object such to change the labels
     * @return {Object} - cytoscape css object
     */
    AIV.returnGeneNameCSS = function(){
        return (this.cy.style()
                    .selector('node[id ^= "Protein"]')
                    .css({
                        'label' : 'data(annotatedName)',
                    })
        );
    };

    /**
     * @function createGeneSummariesAjaxPromise - Take in an array of AGIS and make a POST request to retrieve their gene annotations
     * @param {Array.<string>} ABIs - array of ABIs i.e. ["At5g04340","At4g30930"]
     * @returns {Object} - jQuery AJAX promise object
     */
    AIV.createGeneSummariesAjaxPromise = function(ABIs) {
        var postObj =
            {
                species: 'rice',
                genes : ABIs,
            };
        return $.ajax({
            url: "https://bar.utoronto.ca/api_dev/gene_annotation/",
            type: "POST",
            data: JSON.stringify(postObj),
            contentType: "application/json",
            dataType: "json"
        });
    };

    /**
     * @function addContextMenus - add a right click menu to the current nodes on the cy app
     */
    AIV.addContextMenus = function () {
        this.cy.contextMenus({
            menuItems: [
                {
                    id: 'remove',
                    content: '&nbsp; remove',
                    image: {src: "images/trash-can.svg", width: 12, height: 12, x: 6, y: 6},
                    selector: 'node',
                    onClickFunction: function (event) {
                        var target = event.target || event.cyTarget;
                        target.remove();
                    },
                }
            ]
        });
    };

    /**
     * @helper helperSetAttributes - helper function that sets multiple attributes in one line
     * @param {Object} el - DOM node
     * @param {Object} attrs - attribute object, eg {"src" : "www.google.ca", "data-value" : "kek"}
     */
    AIV.helperSetAttributes = function(el, attrs) {
        for(let key in attrs) {
            el.setAttribute(key, attrs[key]);
        }
    };

    // Ready to run
    $(function() {
        // Initialize AIV
        AIV.initialize();
    });
})(window, jQuery, _, cytoscape, alertify);
