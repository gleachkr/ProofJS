class ProofNode {
    static input () {
            var theInput = document.createElement("input")
            theInput.setAttribute("style","width:1ch");
            theInput.addEventListener('input', function () {
                theInput.setAttribute("style","width:" + theInput.value.length + "ch");
            });
            return theInput
        };

    constructor(obj) { 
        this.forest = [];
        this.ruleContent = "";
        this.infoContent = "";
        this.parentNode

        this.forestElt = document.createElement("div");
        this.forestElt.setAttribute("class","forest");

        this.labelElt = document.createElement("div");
        this.labelElt.setAttribute("class","label");

        this.elt = document.createElement("div");
        this.elt.setAttribute("class","node");
        this.elt.appendChild(this.forestElt);
        this.elt.appendChild(this.labelElt);

        this.inputElt = ProofNode.input()
        this.inputElt.addEventListener('keyup', (e) => {
            if (e.code == "Enter" && e.ctrlKey) {
                e.preventDefault()
                var newNode = this.addChild()
                if (this.forest.length == 1) {
                    newNode.labelElt.lastChild.lastChild.focus();
                } else {
                    newNode.inputElt.focus()
                };
            } else if (e.code == "Enter") {
                e.preventDefault()
                var newNode = this.parentNode.addChild()
                newNode.inputElt.focus();
            } else if (e.code == "Backspace" && e.ctrlKey) {
                this.remove()
                this.parentNode.inputElt.focus();
                this.parentNode.changed()
            };
            this.changed()
        });

        this.labelElt.appendChild(document.createElement("div"));
        this.labelElt.appendChild(this.inputElt);
        this.labelElt.appendChild(document.createElement("div"));

        if (obj) {
            this.label = obj.label;
            this.rule = obj.rule;
            obj.forest.map((o) => {this.addChild(o)})
        };
    }

    get info() { return this.infoContent };

    set info(i) { 
        this.infoContent = i;
        if (this.forest.length > 0) {
            this.forest[0].labelElt.lastChild.lastChild.setAttribute("title",i);
        }
    }

    get label() { return this.inputElt.value };

    set label(l) { 
        var theInput = this.inputElt
        theInput.value = l 
        theInput.setAttribute("style","width:" + theInput.value.length + "ch");
    };

    get rule() { return this.ruleContent };

    set rule(r) { 
        this.ruleContent = r;
        if (this.forest.length > 0) {
            var ruleElt = this.forest[0].labelElt.lastChild.lastChild
            ruleElt.value = r;
            ruleElt.setAttribute("style","width:" + ruleElt.value.length + "ch");
            this.labelElt.lastChild.setAttribute("style","padding-right:" + (ruleElt.value.length * .6) + "ch"); 
        }
    };

    addChild(obj) {
        var child = new ProofNode(obj);
        child.parentNode = this;
        this.forest.push(child);
        if (this.forest.length == 1) {
            var ruleContainer = document.createElement("div");
            var ruleInput = ProofNode.input();
            ruleContainer.setAttribute("class","rule");
            child.labelElt.removeChild(child.labelElt.lastChild);
            ruleContainer.appendChild(ruleInput);
            child.labelElt.appendChild(ruleContainer);
            this.rule = this.rule;
            ruleInput.addEventListener('input', () => {
                this.ruleContent = ruleInput.value
                this.changed()
            });
        }
        this.forestElt.prepend(child.elt);
        return child;
    }

    remove() {
        this.parentNode.forestElt.removeChild(this.elt);
        this.parentNode.forest.splice(this.parentNode.forest.indexOf(this),1);
    }

    toJSON() {
        return {
            label: this.label,
            rule: this.rule,
            forest: this.forest,
        };
    };

    decorate(obj) {
        if (typeof(obj.info) != 'undefined') {
            this.info = obj.info
        }
        var i = 0;
        for (const o of this.forest) {
            if (typeof(obj.forest[i]) != 'undefined') {
                o.decorate(obj.forest[i]);
            }
            i++;
        }
    }

    changed() {
        var e = new Event("changed",{bubbles: true})
        this.elt.dispatchEvent(e)
    }
}

class ProofRoot extends ProofNode {
    constructor(obj) {
        super(obj)
        this.labelElt.setAttribute("class","root");
    }
}
