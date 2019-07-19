class ProofNode {
    static input (init) {
            var theInput = document.createElement("input")
            if (init) {
                theInput.value = init;
                theInput.setAttribute("style","width:" + init.length + "ch");
            }
            else theInput.setAttribute("style","width:1ch");
            theInput.addEventListener('input', function () {
                theInput.setAttribute("style","width:" + theInput.value.length + "ch");
            });
            return theInput
        };

    constructor(obj) { 
        this.forest = [];
        this.labelContent = "";
        this.ruleContent = "";
        this.infoContent = "";
        this.parentNode = null

        if (obj) {
            this.label = obj.label;
            this.rule = obj.rule;
            obj.forest.map((o) => {this.addChild(o)})
        };
    }

    renderOn(target) {
        var elt = document.createElement("div");

        var forestElt = document.createElement("div");
        elt.forestElt = forestElt
        forestElt.setAttribute("class","forest");

        elt.addRule = () => {
            var childElt = forestElt.lastChild
                if (childElt) {
                var childLabel = childElt.lastChild
                var ruleContainer = document.createElement("div");
                var ruleInput = ProofNode.input(this.ruleContent);
                elt.ruleElt = ruleInput;
                ruleContainer.setAttribute("class","rule");
                childLabel.removeChild(childLabel.lastChild);
                ruleContainer.appendChild(ruleInput);
                childLabel.appendChild(ruleContainer);
                ruleInput.value = this.ruleContent;
                ruleInput.addEventListener('input', () => {
                    this.ruleContent = ruleInput.value
                    this.trigger("changed",true);
                });
                this.on("ruleChanged", (r) => {
                    ruleInput.setAttribute("style","width:" + ruleInput.value.length + "ch");
                    labelElt.lastChild.setAttribute("style",
                        "padding-right:" + (ruleInput.value.length * .6) + "ch");
                });
                this.on("infoChanged", (i) => {
                    try {
                        var msg = document.createElement("div");
                        msg.innerHTML = i;
                        msg.setAttribute("class","rulePopper")
                        ruleContainer.appendChild(msg);
                        var thePopper = new Popper(ruleInput,msg,{
                            placement: "right",
                        });
                        thePopper.update()
                    } catch(e) {
                        console.log(e)
                        ruleInput.setAttribute("title", i);
                    }
                });
            }
        }

        var theChildElt = this.forest.map((n) => {return n.renderOn(forestElt)})[0]

        if (this.forest.length > 0) { elt.addRule() }

        var labelElt = document.createElement("div");
        if (!this.parentNode)  labelElt.setAttribute("class","root") 
        else labelElt.setAttribute("class","label");
        
        var inputElt = ProofNode.input(this.label)
        this.on("labelChanged", (l) => {
            if (l != inputElt.value) {
                inputElt.value = l;
                inputElt.setAttribute("style","width:" + l.length + "ch");
            }
        });

        inputElt.addEventListener('keyup', (e) => {
            if (e.code == "Enter" && e.ctrlKey) {
                e.preventDefault()
                var newNode = this.addChild()
                if (this.forest.length == 1) elt.ruleElt.focus();
                else forestElt.firstChild.inputElt.focus();
            } else if (e.code == "Enter") {
                e.preventDefault();
                var newNode = this.parentNode.addChild();
                elt.parentElement.firstChild.inputElt.focus()
            } else if (e.code == "Backspace" && e.ctrlKey) {
                var parentElt = elt.parentElement.parentElement;
                this.remove()
                parentElt.inputElt.focus()
                this.parentNode.trigger("changed",true)
            };
            this.label = inputElt.value
            this.trigger("changed",true)
        });

        elt.setAttribute("class","node");
        elt.appendChild(forestElt);
        elt.appendChild(labelElt);
        labelElt.appendChild(document.createElement("div"));
        labelElt.appendChild(inputElt);
        labelElt.appendChild(document.createElement("div"));
        elt.inputElt = inputElt;

        this.on("removed", () => { 
            var nodeAbove = elt.parentElement.parentElement
            elt.parentElement.removeChild(elt);
            if (this.parentNode.forest.length > 0) nodeAbove.addRule()
        });

        this.on("newChild", (child) => { 
            child.renderOn(forestElt)
            if (this.forest.length == 1) elt.addRule() 
        });

        target.prepend(elt);

        return elt
    }

    get info() { return this.infoContent };

    set info(i) { 
        this.infoContent = i;
        this.trigger("infoChanged", false, i)
    }

    get label() { return this.labelContent };

    set label(l) { 
        this.labelContent = l;
        this.trigger("labelChanged", false, l) 
        this.trigger("changed", true);
    };

    get rule() { return this.ruleContent };

    set rule(r) { 
        this.ruleContent = r;
        this.trigger("ruleChanged", false, r)
        this.trigger("changed", true);
    };

    addChild(obj) {
        var child = new ProofNode(obj);
        child.parentNode = this;
        this.forest.push(child);
        this.trigger("newChild", false, child);
        this.trigger("changed", true);
        return child;
    };

    remove() {
        if (this.parentNode) {
            this.trigger("removed",false);
            this.parentNode.forest.splice(this.parentNode.forest.indexOf(this),1);
        }
    };

    toJSON() {
        return {
            label: this.label,
            rule: this.rule,
            forest: this.forest,
        };
    };

    decorate(obj) {
        if (typeof(obj.info) != 'undefined') this.info = obj.info;
        var i = 0;
        if (typeof(obj.forest) != 'undefined') for (const o of this.forest) {
            if (typeof(obj.forest[i]) != 'undefined') {
                o.decorate(obj.forest[i]);
            }
            i++;
        };
    };

    replace(obj) {
        this.label = obj.label
        this.rule = obj.rule
        this.forest.map((n) => {n.remove()});
        obj.forest.map((o) => {this.addChild(o)});
    };

    on(eventName, handler) {
      if (!this._eventHandlers) this._eventHandlers = {};
      if (!this._eventHandlers[eventName]) this._eventHandlers[eventName] = [];
      this._eventHandlers[eventName].push(handler);
    };

    off(eventName, handler) {
      let handlers = this._eventHandlers && this._eventHandlers[eventName];
      if (!handlers) return;
      for (let i = 0; i < handlers.length; i++) {
        if (handlers[i] === handler) {
          handlers.splice(i--, 1);
        }
      };
    };

    trigger(eventName, bubble, ...args) {
      if (bubble && this.parentNode) {
          this.parentNode.trigger(eventName, bubble, args)
      }
      if (!this._eventHandlers || !this._eventHandlers[eventName]) return;
      this._eventHandlers[eventName].forEach(handler => handler.apply(this, args));
    };
};

class ProofRoot extends ProofNode {
    constructor(obj) {
        super(obj)
    };
};
