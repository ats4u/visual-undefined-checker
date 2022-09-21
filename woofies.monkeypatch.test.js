
require( './woofies.js' ).monkeyPatch();
const { WoofError } = require( './woofies.js' );


/**
 * Test
 */
test( 'test1 : Check if woof() can work with destructuring.' , ()=>{

  expect(()=>{
    const obj = {
      foo : 'foo',
      bar : 'bar',
    }.woof();

    console.log({obj}) ;

    const {
      foo = 'foo',
      bar = 'bar',
      bum = 'uh oh!',
    } = obj;

  }).toThrow( WoofError );
});

test( 'test2 : Check if it works with Array.' , ()=>{
  expect(()=>{
    const obj = {
      arr : [1,2,3],
    }.woof()[4];
  }).toThrow( WoofError );
});


test( 'test3 : Accessing a nesting object with a path.' , ()=>{
  expect(()=>{
    const obj = {
      hello : 'hello',
      world : 'world',
      foo : {
        hello : 'hello',
        world : 'world',
        bar : {
          hello : 'hello',
          world : 'world',
          baz   : {
          },
        }
      }
    }.woof();
    console.log( obj.foo.bar.baz.bum );
  }).toThrow( WoofError );
});

  const obj = {
    hello : 'hello',
    world : 'world',
    foo : {
      hello : 'hello',
      world : 'world',
      bar : {
        hello : 'hello',
        world : 'world',
        baz   : {
        },
      }
    }
  };
  function hello0(obj0,obj1) {
    console.log( obj0.foo.bar.baz.bum );
  }
  function hello1(obj0,obj1) {
    console.log( obj1.foo.bar.baz.bum );
  }

test( 'test4 : Wrapping function (arg0)' , ()=>{
  expect(()=>{
    try {
      hello0.woof()( obj,obj );
    } catch (e) {
      console.error(e);
      throw e;
    }
  }).toThrow( WoofError );
});


test( 'test5 : Wrapping function (arg0)' , ()=>{
  expect(()=>{
    try {
      hello1.woof()( obj,obj );
    } catch (e) {
      console.error(e);
      throw e;
    }
  }).toThrow( WoofError );
});


