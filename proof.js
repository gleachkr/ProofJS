var ProofIDCounter = 0;

class DeductionNode {
    static input (init,calcwidth) {
            var theInput = document.createElement("input")
            if (init) theInput.value = init;
            else theInput.setAttribute("style","width:1ch");
            theInput.setAttribute("style","width:" + calcwidth(theInput) + "ch");
            theInput.addEventListener('input', function () {
                theInput.setAttribute("style","width:" + calcwidth(theInput) + "ch");
            });
            return theInput
        };

    constructor(obj) { 
        this.forest = [];
        this.labelContent = "";
        this.ruleContent = "";
        this.infoContent = "";
        this.class = "";
        this.parentNode = null;
        this.ident = ProofIDCounter++;
        if (obj) {
            this.label = obj.label;
            this.rule = obj.rule;
            if (obj.ident) this.ident = obj.ident
            if (obj.forest) obj.forest.map(o => this.addChild(o))
        };
    }

    renderOn(target) {
        // create element with proprties and methods
        var elt = document.createElement("div");
        elt.forest = document.createElement("div");
        elt.label = document.createElement("div");
        elt.input = DeductionNode.input(this.label,i => {
            if (!this.parentNode) return i.value.length
            else {
                var myShare = this.parentNode.label.length / this.parentNode.forest.length
                return Math.max(i.value.length,myShare)
            }
        })
        if (!this.parentNode) elt.rootElt = _ => elt
        else elt.rootElt = _ => elt.parentElement.parentElement.rootElt()
        this.forest.map(n => {return n.renderOn(elt.forest)})[0]
        elt.addRule = () => {
            var childElt = elt.forest.lastChild
            if (childElt) {
                var childLabel = childElt.lastChild
                var ruleContainer = document.createElement("div");
                elt.rule = DeductionNode.input(this.ruleContent, i => i.value.length);;
                ruleContainer.setAttribute("class","rule");
                ruleContainer.appendChild(elt.rule);
                childLabel.removeChild(childLabel.lastChild);
                childLabel.appendChild(ruleContainer);
                elt.rule.value = this.ruleContent;
                elt.rule.addEventListener('input', _ => {
                    this.ruleContent = elt.rule.value
                    this.trigger("changed", true, this);
                });
                this.on("ruleChanged", r => {
                    elt.rule.value = r
                    elt.rule.dispatchEvent(new Event('input'))
                })
                this.on("infoChanged", (i,c) => {
                    try {
                        try {ruleContainer.popper.destroy()} catch (e) {}
                        var msg = document.createElement("div");
                        var wrapper = document.createElement("div");
                        msg.innerHTML = i;
                        wrapper.setAttribute("class","rulePopper")
                        wrapper.appendChild(msg);
                        ruleContainer.appendChild(wrapper);
                        ruleContainer.setAttribute("class","rule " + c)
                        ruleContainer.popper = new Popper(elt.rule,msg,{
                            placement: "right",
                            removeOnDestroy: true,
                        });
                    } catch(e) {
                        console.log(e)
                        elt.rule.setAttribute("title", i);
                    }
                });
            }
        }
        if (this.forest.length > 0) elt.addRule()
        
        // decorate with attributes
        elt.setAttribute("class","node");
        elt.forest.setAttribute("class","forest");
        if (!this.parentNode) elt.label.setAttribute("class","root") 
        else elt.label.setAttribute("class","label");
        if (this.ident) elt.input.setAttribute("data-proof-id", this.ident) 

        // set up event listeners
        this.on("labelChanged", l => {
            if (l != elt.input.value) {
                elt.input.value = l;
                elt.input.dispatchEvent(new Event('input'))
            }
        });
        this.on("siblingsChanged", () => elt.input.dispatchEvent(new Event('input')));
        this.on("parentChanged", () => elt.input.dispatchEvent(new Event('input')));
        this.on("removed", () => { 
            var nodeAbove = elt.parentElement.parentElement
            elt.parentElement.removeChild(elt);
            if (this.parentNode.forest.length > 0) nodeAbove.addRule()
        });
        this.on("newChild", child => { 
            child.renderOn(elt.forest)
            if (this.forest.length == 1) elt.addRule() 
        });

        elt.input.addEventListener('keydown', e => {if (e.code == "KeyZ" && e.ctrlKey) e.preventDefault()})
        elt.input.addEventListener('keyup', e => {
            if (e.code == "Enter" && e.ctrlKey) {
                e.preventDefault()
                var newNode = this.addChild()
                if (this.forest.length == 1) elt.rule.focus();
                else elt.forest.firstChild.elt.input.focus();
            } else if (e.code == "Enter") {
                e.preventDefault();
                var newNode = this.parentNode.addChild();
                elt.parentElement.firstChild.elt.input.focus()
            } else if (e.code == "Backspace" && e.ctrlKey) {
                var parentElt = elt.parentElement.parentElement;
                this.remove()
                parentElt.inputElt.focus()
                this.parentNode.trigger("changed", true, this)
            } else if (e.code == "KeyZ" && e.ctrlKey && e.shiftKey) {
                e.preventDefault()
                this.trigger("redo",true,elt,this.ident)
            } else if (e.code == "KeyZ" && e.ctrlKey) {
                e.preventDefault()
                this.trigger("undo",true, elt, this.ident)
            };
            this.label = elt.input.value
            this.trigger("changed", true, this)
            this.forest.map(n => n.trigger("parentChanged"))
        });

        // construct everything
        elt.appendChild(elt.forest);
        elt.appendChild(elt.label);
        elt.label.appendChild(document.createElement("div"));
        elt.label.appendChild(elt.input);
        elt.label.appendChild(document.createElement("div"));

        target.prepend(elt);

        return elt
    }

    get info() { return this.infoContent };

    set info(i) { 
        this.infoContent = i;
        this.trigger("infoChanged", false, i, this.class)
    }

    get label() { return this.labelContent };

    set label(l) { 
        this.labelContent = l;
        this.trigger("labelChanged", false, l) 
        this.trigger("changed", true, this);
    };

    get rule() { return this.ruleContent };

    set rule(r) { 
        this.ruleContent = r;
        this.trigger("ruleChanged", false, r)
        this.trigger("changed", true, this);
    };

    addChild(obj) {
        var child = new DeductionNode(obj);
        child.parentNode = this;
        this.forest.push(child);
        this.forest.map(n => n.trigger("siblingsChanged"))
        this.trigger("newChild", false, child);
        this.trigger("changed", true, this);
        return child;
    };

    remove() {
        if (this.parentNode) {
            this.trigger("removed",false);
            this.parentNode.forest.splice(this.parentNode.forest.indexOf(this),1);
            this.parentNode.forest.map(n => n.trigger("siblingsChanged"))
            if (this.parentNode.forest.length == 0) this.parentNode.rule = ""
        }
    };

    toJSON() {
        return {
            label: this.label,
            rule: this.rule,
            ident: this.ident,
            forest: this.forest,
        };
    };

    toInfo() {
        return {
            info: this.info,
            class: this.class,
            forest: this.forest.map(t => t.toInfo()),
        };
    };

    decorate(obj) {
        if (typeof(obj.class) != 'undefined') this.class = obj.class;
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
        var len = this.forest.length;
        for (var i = 0; i < len; i++) this.forest[0].remove()
        obj.forest.map(o => this.addChild(o));
        this.label = obj.label
        this.rule = obj.rule
    };

    on(eventName, handler) {
      if (!this._eventHandlers) this._eventHandlers = {};
      if (!this._eventHandlers[eventName]) this._eventHandlers[eventName] = [];
      this._eventHandlers[eventName].push(handler);
    };

    off(eventName, handler) {
      let handlers = this._eventHandlers && this._eventHandlers[eventName];
      if (!handlers) return;
      var len = handlers.length
      for (let i = 0; i < len; i++) if (handlers[i] === handler) handlers.splice(i--, 1);
    };

    trigger(eventName, bubble, ...args) {
      if (bubble && this.parentNode) this.parentNode.trigger(eventName, bubble, ...args)
      if (!this._eventHandlers || !this._eventHandlers[eventName]) return;
      this._eventHandlers[eventName].forEach(handler => handler.apply(this, args));
    };
};

class DeductionRoot extends DeductionNode {
    constructor(obj) {
        super(obj)
        this.history = []
        this.present= JSON.stringify(this)
        this.future= []
        this.undoTimeout = false
        this.on("changed",() => {
            this.updateTimeout = setTimeout(() => {
                var newState = JSON.stringify(this)
                if (newState != this.present) {
                    this.history.push(this.present)
                    this.future = []
                    this.present = newState
                }
                this.undoTimeout = false
            }, 500)
        })
        this.on("undo", (e,i) => {
            if (this.history.length > 0 && !this.undoTimeout) {
                var theRootElt = e.rootElt()
                this.future.push(this.present)
                this.replace(JSON.parse(this.history.pop()))
                this.present=JSON.stringify(this)
                theRootElt.querySelector("[data-proof-id='" + i + "']").focus()
            }
        })
        this.on("redo", (e,i) => {
            if (this.future.length > 0 && !this.undoTimeout) {
                var theRootElt = e.rootElt()
                this.history.push(this.present)
                this.replace(JSON.parse(this.future.pop()))
                this.present=JSON.stringify(this)
                theRootElt.querySelector("[data-proof-id='" + i + "']").focus()
            }
        })
    };
};

class ProofRoot extends DeductionRoot {
    renderOn(target) {
        var elt = super.renderOn(target)
        elt.input.setAttribute("readonly","readonly")
    }
};
