/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const parseTestFiles = require( './utils/parsefiles' );
const { cloneDeep } = require( 'lodash' );
const { expect } = require( 'chai' );

describe( 'integration test', () => {
	/** @type {Array.<Doclet>} */
	const originalDoclets = parseTestFiles();

	/** @type {Array.<Doclet>} */
	let doclets;

	beforeEach( () => {
		doclets = cloneDeep( originalDoclets );
	} );

	describe( 'interfaces and mixins', () => {
		it( 'EmitterMixin doclet should contain correct longname', () => {
			const emitterMixinDoclet = doclets.find( d => d.name === 'EmitterMixin' );

			expect( emitterMixinDoclet.longname ).to.equal( 'module:utils/emittermixin~EmitterMixin' );
			expect( emitterMixinDoclet.memberof ).to.equal( 'module:utils/emittermixin' );
		} );

		it( 'EmitterMixin doclet should be generated only once', () => {
			const emitterMixinDoclets = doclets.filter( d => d.name === 'EmitterMixin' );

			expect( emitterMixinDoclets.length ).to.equal( 1 );
		} );

		it( 'Emitter#on doclet should be generated for the `on` method', () => {
			const emitterOnDoclet = doclets.find( d => d.longname == 'module:utils/emittermixin~Emitter#on' );

			expect( emitterOnDoclet ).to.be.an( 'object' );
			expect( emitterOnDoclet.description ).to.equal(
				'Registers a callback function to be executed when an event is fired.'
			);

			expect( emitterOnDoclet.scope ).to.equal( 'instance' );
			expect( emitterOnDoclet.memberof ).to.equal( 'module:utils/emittermixin~Emitter' );
		} );

		it( 'EmitterMixin#on doclet should be generated for the `on` method and should inherit docs ', () => {
			const emitterMixinOnDoclet = doclets.find( d => d.longname == 'module:utils/emittermixin~EmitterMixin#on' );

			expect( emitterMixinOnDoclet ).to.be.an( 'object' );

			expect( emitterMixinOnDoclet.description ).to.equal(
				'Registers a callback function to be executed when an event is fired.'
			);

			expect( emitterMixinOnDoclet.scope ).to.equal( 'instance' );
			expect( emitterMixinOnDoclet.memberof ).to.equal( 'module:utils/emittermixin~EmitterMixin' );
		} );
	} );

	describe( 'exported constants and variables', () => {
		it( 'doclet for MAGIC_CONSTANT should be generated', () => {
			const magicConstantDoclet = doclets.find( d => d.longname == 'module:engine/magic~MAGIC_CONSTANT' );

			expect( magicConstantDoclet ).to.be.an( 'object' );
		} );

		it( 'doclet for magicVariable should be generated', () => {
			const magicVariableDoclet = doclets.find( d => d.longname == 'module:engine/magic~magicVariable' );

			expect( magicVariableDoclet ).to.be.an( 'object' );
		} );
	} );

	describe( 'class extending mixins that implements interfaces', () => {
		it( 'doclet for the Emitter class should be generated', () => {
			const emitterDoclet = doclets.find( d => d.longname == 'module:engine/emitter~Emitter' );

			expect( emitterDoclet ).to.be.an( 'object' );

			expect( emitterDoclet.implementsNested ).to.deep.equal( [
				'module:utils/emittermixin~Emitter'
			] );

			expect( emitterDoclet.mixesNested ).to.deep.equal( [
				'module:utils/emittermixin~EmitterMixin'
			] );
		} );

		it( 'doclet for the `on` method should be generated', () => {
			const emitterOnDoclet = doclets.find( d => d.longname == 'module:engine/emitter~Emitter#on' );

			expect( emitterOnDoclet ).to.be.an( 'object' );

			expect( emitterOnDoclet.scope ).to.equal( 'instance' );
			expect( emitterOnDoclet.memberof ).to.equal( 'module:engine/emitter~Emitter' );

			expect( emitterOnDoclet.mixed ).to.equal( true );
		} );
	} );
} );

