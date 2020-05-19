const generatorSettingsManager={
	tries: {
		type: "number",
		default: 80,
		validate: (key, value, type)=>{
			if (typeof value != "number") `Parameter "${key}" has to be type of "${type}".`;
			if (value <= 0) throw `Parameter "${key}" has to be greater than 0.`;
			if (!Number.isInteger(value)) throw `Parameter "${key}" has to be an integer.`;
		},
	},
	safeMode: {
		type: "boolean",
		default: true,
		validate: (key, value, type)=>{
			return true;
		},
	},
	forceCombiningOrigins: {
		type: "boolean",
		default: false,
		validate: (key, value, type)=>{
			return true;
		},
	},
	minLength: {
		type: "number",
		default: 1,
		validate: (key, value, type)=>{
			if (typeof value != "number") `Parameter "${key}" has to be type of "${type}".`;
			if (value <= 0) throw `Parameter "${key}" has to be greater than 0.`;
			if (!Number.isInteger(value)) throw `Parameter "${key}" has to be an integer.`;
		},
	},
	maxLength: {
		type: "number",
		default: 400,
		validate: (key, value, type)=>{
			if (typeof value != "number") `Parameter "${key}" has to be type of "${type}".`;
			if (value <= 0) throw `Parameter "${key}" has to be greater than 0.`;
			if (!Number.isInteger(value)) throw `Parameter "${key}" has to be an integer.`;
		},
	},
	deepness: {
		type: "number",
		default: 40,
		validate: (key, value, type)=>{
			if (typeof value != "number") `Parameter "${key}" has to be type of "${type}".`;
			if (value < 0) throw `Parameter "${key}" has to be greater or equal to 0.`;
			if (!Number.isInteger(value)) throw `Parameter "${key}" has to be an integer.`;
		},
	},
	trust: {
		type: "number",
		default: 2,
		validate: (key, value, type)=>{
			if (typeof value != "number") `Parameter "${key}" has to be type of "${type}".`;
			if (value < 0) throw `Parameter "${key}" has to be greater or equal to 0.`;
			if (!Number.isInteger(value)) throw `Parameter "${key}" has to be an integer.`;
		},
	},
	weightsLeft: {
		type: "object",
		default: {},
		validate: (key, value, type)=>(true),
	},
	weightsRight: {
		type: "object",
		default: {},
		validate: (key, value, type)=>(true),
	},
	splitter: {
		type: "string",
		default: "",
		validate: (key, value, type)=>(true),
	},
	startingCharacter: {
		type: "string",
		default: String.fromCharCode(2),
		validate: (key, value, type)=>(true),
	},
	endingCharacter: {
		type: "string",
		default: String.fromCharCode(3),
		validate: (key, value, type)=>(true),
	},
};

function RandomTextGenerator(settings) {
	if (!settings) settings={}
	console.warn("random-text-generator-js is still in the testing stage. Some features may not work as intended. Report any problems in https://github.com/Rafal-Majewski/random-text-generator-js/issues.");
	Object.keys(generatorSettingsManager).forEach((key)=>{
		if (settings[key] != undefined) {
			generatorSettingsManager[key].validate(key, settings[key], generatorSettingsManager[key].type);
			this[key]=settings[key];
		}
		else this[key]=generatorSettingsManager[key].default;
	});
	if (this.minLength > this.maxLength) throw "minLength has to be smaller or equal to maxLength";
}

RandomTextGenerator.prototype._exampleIterator=function(example, func) {
	for (let i=0; i<example.length-1; ++i) {
		for (let i2=i; i2<Math.min(example.length-1, i+this.deepness); ++i2) {
			let from=example.slice(i, i2+1).join(this.splitter);
			let to=example[i2+1];
			func(from, to);
		}
	}
};

RandomTextGenerator.prototype._learn=function(weights, example, origin, multiplier) {
	this._exampleIterator(example, (from, to)=>{
		if (weights[origin] == undefined) weights[origin]={};
		if (weights[origin][from] == undefined) weights[origin][from]={};
		if (weights[origin][from][to] == undefined) weights[origin][from][to]=0;
		weights[origin][from][to]+=multiplier;
	});
};

RandomTextGenerator.prototype._forget=function(weights, example, origin, multiplier) {
	this._exampleIterator(example, (from, to)=>{
		if (weights[origin][from] == undefined) weights[origin][from]={};
		if (weights[origin][from][to] == undefined) weights[origin][from][to]=0;
		weights[origin][from][to]-=multiplier;
		if (weights[origin][from][to] <= 0) delete weights[origin][from][to];
		if (Object.keys(weights[origin][from]).length <= 0) delete weights[origin][from];
		if (Object.keys(weights[origin]).length <= 0) delete weights[origin];
	});
};

RandomTextGenerator.prototype.learnLeft=function(example, origin, multiplier, isRaw) {
	this._learn(
		this.weightsLeft,
		[...(isRaw)?(""):(this.endingCharacter), ...example, ...(isRaw)?(""):(this.startingCharacter)].reverse(),
		origin || "_default",
		(multiplier != null)?(multiplier):(1),
	);
};

RandomTextGenerator.prototype.learnBoth=function(example, origin, multiplier, isRaw) {
	this._learn(
		this.weightsLeft,
		[...(isRaw)?(""):(this.endingCharacter), ...example, ...(isRaw)?(""):(this.startingCharacter)].reverse(),
		origin || "_default",
		(multiplier != null)?(multiplier):(1),
	);
	this._learn(
		this.weightsRight,
		[...(isRaw)?(""):(this.startingCharacter), ...example, ...(isRaw)?(""):(this.endingCharacter)],
		origin || "_default",
		(multiplier != null)?(multiplier):(1),
	);
};

RandomTextGenerator.prototype.learnRight=function(example, origin, multiplier, isRaw) {
	this._learn(
		this.weightsRight,
		[...(isRaw)?(""):(this.startingCharacter), ...example, ...(isRaw)?(""):(this.endingCharacter)],
		origin || "_default",
		(multiplier != null)?(multiplier):(1),
	);
};

RandomTextGenerator.prototype.forgetBoth=function(example, origin, multiplier, isRaw) {
	this._forget(
		this.weightsLeft,
		[...(isRaw)?(""):(this.endingCharacter), ...example, ...(isRaw)?(""):(this.startingCharacter)].reverse(),
		origin || "_default",
		(multiplier != null)?(multiplier):(1),
	);
	this._forget(
		this.weightsRight,
		[...(isRaw)?(""):(this.startingCharacter), ...example, ...(isRaw)?(""):(this.endingCharacter)],
		origin || "_default",
		(multiplier != null)?(multiplier):(1),
	);
};

RandomTextGenerator.prototype.forgetLeft=function(example, origin, multiplier, isRaw) {
	this._forget(
		this.weightsLeft,
		[...(isRaw)?(""):(this.endingCharacter), ...example, ...(isRaw)?(""):(this.startingCharacter)].reverse(),
		origin || "_default",
		(multiplier != null)?(multiplier):(1),
	);
};

RandomTextGenerator.prototype.forgetRight=function(example, origin, multiplier, isRaw) {
	this._forget(
		this.weightsRight,
		[...(isRaw)?(""):(this.startingCharacter), ...example, ...(isRaw)?(""):(this.endingCharacter)],
		origin || "_default",
		(multiplier != null)?(multiplier):(1),
	);
};

RandomTextGenerator.prototype._getNexts=function(weights, text, origins, safe) {
	let nexts={};
	let sum=0;
	let from=text;
	for (let origin of origins) {
		if (!weights[origin]) continue;
		let weightsRow=weights[origin][from];
		if (weightsRow) {
			for (let to of Object.keys(weightsRow)) {
				if (!nexts[to]) nexts[to]=0;
				sum+=weightsRow[to];
				nexts[to]+=weightsRow[to];
			}
		}
		else if (!safe && this.forceCombiningOrigins) return {};
	}
	if (!safe && sum < this.trust) return {};
	for (let to of Object.keys(nexts)) nexts[to]/=sum;
	return nexts;
};


RandomTextGenerator.prototype._chooseNext=function(nexts, pick) {
	for (let to of Object.keys(nexts)) {
		pick-=nexts[to];
		if (pick < 0) return to;
	}
	return null;
};

RandomTextGenerator.prototype._predict=function(weights, splittedText, origins, obeyLimit, safe) {
	let realLength=splittedText.length-(splittedText[0] == this.startingCharacter);
	if (obeyLimit && realLength > this.maxLength) return null;
	for (let i=Math.max(0, splittedText.length-this.deepness); i<splittedText.length; ++i) {
		let from=splittedText.slice(i);
		let nexts=this._getNexts(weights, from.join(this.splitter), origins, safe);
		let next;
		if (obeyLimit) {
			if (realLength < this.minLength && nexts[this.endingCharacter]) {
				let smaller=nexts[this.endingCharacter];
				delete nexts[this.endingCharacter];
				next=this._chooseNext(nexts, Math.random()*(1-smaller));
			}
			else if (realLength == this.maxLength) {
				if (nexts[this.endingCharacter]) return this.endingCharacter;
			}
			else next=this._chooseNext(nexts, Math.random());
		}
		else next=this._chooseNext(nexts, Math.random());
		if (next) return next;
	}
	if (this.safeMode && !safe) return this._predict(weights, splittedText, origins, obeyLimit, true);
	return null;
};

RandomTextGenerator.prototype.predictRight=function(text, origins, isRaw, obeyLimit) {
	if (!text) text="";
	return this._predict(
		this.weightsRight,
		[...(isRaw)?(""):(this.startingCharacter), ...text],
		origins || Object.keys(this.weightsRight), obeyLimit
	);
};

RandomTextGenerator.prototype.predictLeft=function(text, origins, isRaw, obeyLimit) {
	if (!text) text="";
	return this._predict(
		this.weightsLeft,
		[...text, ...(isRaw)?(""):(this.startingCharacter)].reverse(),
		origins || Object.keys(this.weightsLeft), obeyLimit
	);
};

RandomTextGenerator.prototype.generateRight=function(text, origins, isRaw) {
	if (!text) text="";
	if (!origins) origins=Object.keys(this.weightsRight);
	let splittedText;
	let realLength;
	let reset=()=>{
		splittedText=[...(isRaw)?(""):(this.startingCharacter), ...text];
		realLength=splittedText.length-!isRaw;
	};
	reset();
	if (realLength >= this.maxLength) return splittedText.slice(!isRaw).join(this.splitter);
	for (let i=0; i<this.tries; ++i) {
		while (true) {
			let character=this._predict(this.weightsRight, splittedText, origins, this.safeMode);
			if (character == null) {
				reset();
				break;
			}
			if (character == this.endingCharacter) {
				if (realLength < this.minLength) {
					reset();
					break;
				}
				return splittedText.slice(!isRaw).join(this.splitter);
			}
			if (realLength+1 > this.maxLength) {
				reset();
				break;
			}
			splittedText.push(character);
			++realLength;
		}
	}
	return null;
};

RandomTextGenerator.prototype.generateBoth=function(text, origins) {
	if (!text) text="";
	if (!origins) origins=[...new Set([...Object.keys(this.weightsRight) ,...Object.keys(this.weightsLeft)])];
	let splittedText;
	let leftDone;
	let rightDone;
	let reset=()=>{
		splittedText=[...text];
		leftDone=false;
		rightDone=false;
	};
	reset();
	if (splittedText.length >= this.maxLength) return splittedText.join(this.splitter);
	for (let i=0; i<this.tries; ++i) {
		while (true) {
			let characterLeft;
			let characterRight;
			if (!leftDone) {
				characterLeft=this._predict(this.weightsLeft, [...splittedText].reverse(), origins, this.safeMode);
				if (!characterLeft) {
					reset();
					break;
				}
				else if (characterLeft == this.endingCharacter) leftDone=true;
			}
			if (!rightDone) {
				characterRight=this._predict(this.weightsRight, splittedText, origins, this.safeMode);
				if (!characterRight) {
					reset();
					break;
				}
				else if (characterRight == this.endingCharacter) rightDone=true;
			}
			if (leftDone && rightDone) {
				if (splittedText.length < this.minLength || splittedText.length > this.maxLength) {
					reset();
					break;
				}
				else return splittedText.join(this.splitter);
			}
			if (!leftDone) splittedText.unshift(characterLeft);
			if (!rightDone) splittedText.push(characterRight);
		}
	}
	return null;
};

RandomTextGenerator.prototype._shrink=function(weights, origins) {
	for (let origin of origins) {
		if (!weights[origin]) continue;
		for (let from of Object.keys(weights[origin])) {
			//console.log(weights);
			let weightsRow=weights[origin][from];
			let sum=0;
			for (let to of Object.keys(weightsRow)) sum+=weightsRow[to];
			if (sum < this.trust) delete weights[origin][from];
		}
	}
};

RandomTextGenerator.prototype.shrinkLeft=function(origins) {
	this._shrink(this.weightsLeft, origins || Object.keys(this.weightsLeft));
};

RandomTextGenerator.prototype.shrinkRight=function(origins) {
	this._shrink(this.weightsRight, origins || Object.keys(this.weightsRight));
};

RandomTextGenerator.prototype.shrinkBoth=function(origins) {
	this._shrink(this.weightsLeft, origins || Object.keys(this.weightsLeft));
	this._shrink(this.weightsRight, origins || Object.keys(this.weightsRight));
};


RandomTextGenerator.prototype.saveToJson=function() {return JSON.stringify(this);};
RandomTextGenerator.prototype.loadFromJson=function(json) {
	let settings=JSON.parse(json);
	Object.keys(generatorSettingsManager).forEach((key)=>{
		if (settings[key] != undefined) {
			generatorSettingsManager[key].validate(key, settings[key], generatorSettingsManager[key].type);
			this[key]=settings[key];
		}
	});
	if (this.minLength > this.maxLength) throw "minLength has to be smaller or equal to maxLength";
};
RandomTextGenerator.prototype.saveWeightsToJson=function() {
	return JSON.stringify({weightsLeft: this.weightsLeft, weightsRight: this.weightsRight});
};
RandomTextGenerator.prototype.loadWeightsFromJson=function(json) {
	let weights=JSON.parse(json);
	this.weightsLeft=weights.weightsLeft;
	this.weightsRight=weights.weightsRight;
};

RandomTextGenerator.prototype.predict=RandomTextGenerator.prototype.predictRight;
RandomTextGenerator.prototype.learn=RandomTextGenerator.prototype.learnRight;
RandomTextGenerator.prototype.forget=RandomTextGenerator.prototype.forgetRight;
RandomTextGenerator.prototype.generate=RandomTextGenerator.prototype.generateRight;
RandomTextGenerator.prototype.shrink=RandomTextGenerator.prototype.shrinkBoth;

RandomTextGenerator.prototype.generateLeft=function(text, origins, isRaw) {
	if (!text) text="";
	if (!origins) origins=Object.keys(this.weightsLeft);
	let splittedText;
	let realLength;
	let reset=()=>{
		splittedText=[...text, ...(isRaw)?(""):(this.startingCharacter)].reverse();
		realLength=splittedText.length-!isRaw;
	};
	reset();
	if (realLength >= this.maxLength) return splittedText.slice(!isRaw).join(this.splitter);
	for (let i=0; i<this.tries; ++i) {
		while (true) {
			let character=this._predict(this.weightsLeft, splittedText, origins, this.safeMode);
			if (character == null) {
				reset();
				break;
			}
			if (character == this.endingCharacter) {
				if (realLength < this.minLength) {
					reset();
					break;
				}
				return splittedText.slice(!isRaw).reverse().join(this.splitter);
			}
			if (realLength+1 > this.maxLength) {
				reset();
				break;
			}
			splittedText.push(character);
			++realLength;
		}
	}
	return null;
};

RandomTextGenerator.prototype._validate=function(weights, text, origins) {
	let sum=0;
	let all=0;
	this._exampleIterator(text, (from, to)=>{	
		let nexts=this._getNexts(weights, from, origins, this.safeMode);
		if (nexts[to]) ++sum;
		++all;
	});
	return sum/all || 0;
}

RandomTextGenerator.prototype.validateLeft=function(text, origins, isRaw) {
	if (!text) text="";
	if (!origins) origins=Object.keys(this.weightsLeft);
	return this._validate(this.weightsLeft, [...(isRaw)?(""):(this.endingCharacter), ...text, ...(isRaw)?(""):(this.startingCharacter)].reverse(), origins);
};

RandomTextGenerator.prototype.validateRight=function(text, origins, isRaw) {
	if (!text) text="";
	if (!origins) origins=Object.keys(this.weightsRight);
	return this._validate(this.weightsRight, [...(isRaw)?(""):(this.startingCharacter), ...text, ...(isRaw)?(""):(this.endingCharacter)], origins);
};

RandomTextGenerator.prototype.validate=RandomTextGenerator.prototype.validateRight;

createRandomTextGenerator=(settings)=>{
	if (!settings) settings={};
	if (settings.legacy == null) settings.legacy=true;
	if (!settings.legacy) return RandomTextGenerator;
	console.warn("You are using the legacy version of random-text-generator-js, which is going to be removed in an upcoming update.");
	let randomTextGenerator={multiplier: 1, tries: 80, deepness: 40, trust: 2, weights: {}, splitter: "", limit: 400, startingCharacter: String.fromCharCode(2), endingCharacter: String.fromCharCode(3)};
	randomTextGenerator={...randomTextGenerator, ...settings};
	randomTextGenerator.learnExample=(example, isRaw)=>{
		example=[...((isRaw)?(""):(randomTextGenerator.startingCharacter)), ...example, ...((isRaw)?(""):(randomTextGenerator.endingCharacter))];
		for (let i=0; i<example.length-1; ++i) {
			for (let i2=i; i2<Math.min(example.length-1, i+randomTextGenerator.deepness); ++i2) {
				let from=example.slice(i, i2+1).join(randomTextGenerator.splitter);
				let to=example[i2+1];
				if (!randomTextGenerator.weights[from]) randomTextGenerator.weights[from]={};
				if (!randomTextGenerator.weights[from][to]) randomTextGenerator.weights[from][to]=0;
				randomTextGenerator.weights[from][to]+=randomTextGenerator.multiplier;
			}
		}
	};
	randomTextGenerator.forgetExample=(example, isRaw)=>{
		example=[...((isRaw)?(""):(randomTextGenerator.startingCharacter)), ...example, ...((isRaw)?(""):(randomTextGenerator.endingCharacter))];
		for (let i=0; i<example.length-1; ++i) {
			for (let i2=i; i2<Math.min(example.length-1, i+randomTextGenerator.deepness); ++i2) {
				let from=example.slice(i, i2+1).join(randomTextGenerator.splitter);
				let to=example[i2+1];
				if (!randomTextGenerator.weights[from]) randomTextGenerator.weights[from]={};
				if (!randomTextGenerator.weights[from][to]) randomTextGenerator.weights[from][to]=0;
				randomTextGenerator.weights[from][to]-=randomTextGenerator.multiplier;
				if (randomTextGenerator.weights[from][to] <= 0) delete randomTextGenerator.weights[from][to];
				if (Object.keys(randomTextGenerator.weights[from]).length <= 0) delete randomTextGenerator.weights[from];
			}
		}
	};
	randomTextGenerator.forgetExamples=(examples, isRaw)=>{
		if (examples) for (let example of examples) randomTextGenerator.forgetExample(example);
		else randomTextGenerator.weights={};
	};
	randomTextGenerator.learnExamples=(examples, isRaw)=>{
		for (let example of examples) randomTextGenerator.learnExample(example, isRaw);
	};
	randomTextGenerator.predictCharacter=(splittedText)=>{
		let from=splittedText.slice(Math.max(0, splittedText.length-randomTextGenerator.deepness));
		for (let i=0; i<randomTextGenerator.deepness; ++i) {
			let weightsRow=randomTextGenerator.weights[from.join(randomTextGenerator.splitter)];
			if (weightsRow) {
				let sum=0;
				for (let to of Object.keys(weightsRow)) sum+=weightsRow[to];
				if (sum >= randomTextGenerator.trust) {
					let pick=Math.random()*sum;
					for (let to of Object.keys(weightsRow)) {
						pick-=weightsRow[to];
						if (pick < 0) return to;
					}
				}
			}
			from=from.slice(1);
		}
		from=splittedText.slice(Math.max(0, splittedText.length-randomTextGenerator.deepness));
		for (let i=0; i<randomTextGenerator.deepness; ++i) {
			let weightsRow=randomTextGenerator.weights[from.join(randomTextGenerator.splitter)];
			if (weightsRow) {
				let sum=0;
				for (let to of Object.keys(weightsRow)) sum+=weightsRow[to];
				let pick=Math.random()*sum;
				for (let to of Object.keys(weightsRow)) {
					pick-=weightsRow[to];
					if (pick < 0) return to;
				}
			}
			from=from.slice(1);
		}
	};
	randomTextGenerator.generate=()=>{
		let splittedText=[randomTextGenerator.startingCharacter];
		for (let i=0; i<randomTextGenerator.tries; ++i) {
			while (true) {
				let character=randomTextGenerator.predictCharacter(splittedText);
				if (character === randomTextGenerator.endingCharacter) return splittedText.slice(1);
				if (!character || splittedText.length > randomTextGenerator.limit) {
					splittedText=[randomTextGenerator.startingCharacter];
					break;
				}
				splittedText.push(character);
			}
		}
	};
	randomTextGenerator.lengthen=(splittedText)=>{
		let newSplittedText=[...splittedText];
		for (let i=0; i<randomTextGenerator.tries; ++i) {
			while (true) {
				let character=randomTextGenerator.predictCharacter(newSplittedText);
				if (character === randomTextGenerator.endingCharacter) return newSplittedText;
				if (!character || newSplittedText.length > randomTextGenerator.limit) {
					newSplittedText=[...splittedText];
					break;
				}
				newSplittedText.push(character);
			}
		}
	};
	randomTextGenerator.shrink=()=>{
		for (let from of Object.keys(randomTextGenerator.weights)) {
			let weightsRow=randomTextGenerator.weights[from];
			let sum=0;
			for (let to of Object.keys(weightsRow)) sum+=weightsRow[to];
			if (sum < randomTextGenerator.trust) delete randomTextGenerator.weights[from];
		}
	};
	randomTextGenerator.saveToJson=()=>(JSON.stringify(randomTextGenerator));
	randomTextGenerator.loadFromJson=(json)=>{randomTextGenerator={...JSON.parse(json), ...randomTextGenerator}};
	randomTextGenerator.saveWeightsToJson=()=>(JSON.stringify(randomTextGenerator.weights));
	randomTextGenerator.loadWeightsFromJson=(json)=>{randomTextGenerator.weights=JSON.parse(json)};
	return randomTextGenerator;
};

module.exports=createRandomTextGenerator;