class WoofError extends Error {
  constructor(msg,targetObject, targetPath, ...args) {
    super(msg,...args);
    this.targetPath = targetPath;
    this.targetObject = targetObject;
  }
  // toString() {
  //   return 'a good error message';
  // }
}
module.exports.WoofError = WoofError;


/**
 * Implementation of Woof Objects
 */
function createHandler(state) {
  // const {
  //   target       = (()=>{throw 'target cannot be null!'})(),
  //   woofName     = 'woof',
  //   woofedTarget = (()=>{throw 'woofedTarget cannot be null!'})(),
  //   woofedParentValue = null,
  // } = state;

  const woofedName       = state.woofName + 'ed';
  const isWoofed         = `__${woofedName.toUpperCase()}ED_YES__`;
  const woofParentName   = state.woofName + 'Parent';
  const woofTargetName   = state.woofName + 'Target';

  function searchWoofedRoot( woofedObject ) {
    const woofedParentValue = woofedObject[woofParentName];
    return woofedParentValue === null ? woofedObject : searchWoofedRoot( woofedParentValue );
  }
  function get (...args) {
    const [o,p]=args;

    if ( p === woofedName ) {
      return isWoofed;

    } else if ( p === 'toJSON' ) {
      /** 
       * JSON.stringify() function refer `toJSON` no matter the field
       * `toJSON` exists or not. Even Though this gonna be an inconsistent
       * behavior, we have no way but ignore it here.
       *  (Fri, 22 Jul 2022 14:55:51 +0900)
       */
      return Reflect.get(...args);
    } else if ( p === 'then' ) {
      /*
       * `await` always retrieves 'then' field never check its existence beforehand.
       *  See : https://stackoverflow.com/a/53890904/17858456
       */
      return null; // Say "I'm not thenable"; otherwise you'll get ReferenceError thrown.

      //} else if ( p === state.woofName ) {
      //  /**
      //   * If it is already woofed, then return itself.
      //   */
      //  return state.woofedTarget;
      //  // throw new Error( `This object is already ${woofedName}.`  );

    } else if ( p === woofParentName ) {
      return state.woofedParentValue;

    } else if ( p === woofTargetName ) {
      return state.target;

    } else if ( p in o ) {
      // console.error(`Object.hasOwn( o,${p.toString()})`,  Object.hasOwn( o,p )  );
      // const v = o[p];
      const v = Reflect.get(...args);
      if ( (typeof p !== 'symbol' ) && Object.hasOwn( o,p ) ) {
        // console.error( p );
        // enumerable : true
        if ( state.recursive && typeof v  === 'object' && v !== null && v !== undefined ) {
          return v[woofedName] === isWoofed ? v : woofy( v, 
            state.woofName, 
            true, 
            // this becomes woofedParentKeyList 
            [ ... state.woofedParentKeyList, p ], 
            // this becomes woofedParentValue
            state.woofedTarget 
          );
        } else {
          return v;
        }
      } else {
        // enumerable : false
        return v;
      }
    } else {
      if (typeof p === 'symbol' ) {
        const v = Reflect.get(...args);
        return v;
      } else {
        const keyList        = [ ... state.woofedParentKeyList, p ];
        const targetPath     = keyList2string( keyList );
        const message        = `'${targetPath}' is not defined in this object`;
        const rootWoofTarget = searchWoofedRoot( state.woofedTarget )[woofTargetName];

        console.trace( message, rootWoofTarget );

        throw new WoofError( message, rootWoofTarget,targetPath );
      }
    }
  }

  /*
   * Copy all methods on Reflect object to the newly created object.
   */
  const handler = {};
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties
  Object.getOwnPropertyNames( Reflect ).forEach( e=>handler[e] = Reflect[e] );
  // Object.assign( {}, Reflect );
  handler.get = get;
  return handler;
};

function keyList2string(keyList) {
  return "obj" + ( keyList.map(e=>( e.match(/[0-9]+/)  ? `[${e}]` : `.${e}`) ).join(""));
}


/**
 * The Method to Create a Woof Object 
 */
function woofy( target, woofName, recursive, woofedParentKeyList, woofedParentValue ) {
  const state = {
    target,
    woofName,
    recursive,
    woofedTarget : null,
    woofedParentKeyList,
    woofedParentValue,
  };
  state.woofedTarget = new Proxy( target, createHandler( state ) );
  // console.error( 'state.woofedTarget', state.woofedTarget );
  return state.woofedTarget;
}

function woofunc( target, woofName, recursive, woofedParentKeyList, woofedParentValue  ) {
  const f = function (...args) {
    args = args.map( e=>{
      if (typeof e === 'object' && e !== null && e !== undefined ) {
        const object = e;
        return woofer({object,woofName,recursive}) ;
      } else {
        return e;
      } 
    });
    return target.apply( this, args );
  };
  return f;
}


function woofer({
  object = (()=>{throw new ReferenceError('object was not specified')})(),
  woofName = 'woof',
  recursive = true,
} = {} ) {
  if ( object === global || object === globalThis ) {
    console.trace( 'global this error' );
    throw new Error( 'global this error' );
  }
  if ( object instanceof Function ) {
    return woofunc( object, woofName, recursive, [], null );
  } else {
    return woofy( object, woofName, recursive, [],  null );
  }
}


/**
 * The Method to Install Woofies
 */
function woofdown( woofName='woof', applyMonkeyPatch=false ){ 
  if ( woofName == null ) {
    woofName = 'woof'
  }
  if ( typeof woofName !== 'string' ) {
    throw new TypeError( `${woofName} is not a string value` );
  }

  // Apply monkey patching ...
  if ( applyMonkeyPatch  ) {
    Object.defineProperties( Object.prototype, {
      [woofName] : {
        value  : function wooferMonkeypatch(nargs) {
          return woofer( { ... nargs, object: this, });
        },
        configurable : true,
      },
    });
  }
}

module.exports.__DONE_MONKEY_PATCH = false;
module.exports.monkeyPatch = function monkeyPatch(woofName='woof') {
  throw new ReferenceError( 'now Monkey patching is deprecated' );
  if ( module.exports.__DONE_MONKEY_PATCH ) {
    return;
  } else {
    module.exports.__DONE_MONKEY_PATCH = true;
    woofdown(woofName,true); 
  }
};


function woof( object, nargs = {} ) {
  // return object;
  const t = typeof object;
  if ( t === null ) {
    throw new TypeError('the argument is null ');
  }
  if ( t === undefined ) {
    throw new TypeError('the argument is undefined ');
  }
  if ( (object instanceof Function ) || ( t === 'object' ) || ( t === 'function' ) ) {
    return woofer( { ... nargs, object : object } );
  }
  throw new TypeError('unsupported type');
};
module.exports.woof = woof;




/**
 * Install Woofies
 */
// woofdown();


/**
 * Test
 */

// test();


