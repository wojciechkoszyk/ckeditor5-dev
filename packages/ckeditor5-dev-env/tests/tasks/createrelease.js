/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const validator = require( '../../lib/utils/releasevalidator' );

describe( 'tasks', () => {
	describe( 'createRelease', () => {
		let createRelease, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				getNewReleaseType: sandbox.stub(),
				createGithubRelease: sandbox.stub(),
				getLastCreatedTag: sandbox.stub(),
				updateDependenciesVersions: sandbox.stub(),
				parseGithubUrl: sandbox.stub(),
				logger: {
					info: sandbox.spy(),
					warning: sandbox.spy(),
					error: sandbox.spy()
				},
				tools: {
					shExec: sandbox.stub()
				},
				validator: {},
				utils: {
					getLatestChangesFromChangelog: sandbox.stub()
				}
			};

			// Mock the validator methods.
			for ( const item of Object.keys( validator ) ) {
				stubs.validator[ item ] = sandbox.stub( validator, item );
			}

			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
				tools: stubs.tools,

				logger() {
					return stubs.logger;
				}
			} );

			mockery.registerMock( '../utils/changelog', stubs.utils );
			mockery.registerMock( '../utils/releasevalidator', stubs.validator );
			mockery.registerMock( './creategithubrelease', stubs.createGithubRelease );
			mockery.registerMock( '../utils/getnewreleasetype', stubs.getNewReleaseType );
			mockery.registerMock( '../utils/getlastcreatedtag', stubs.getLastCreatedTag );
			mockery.registerMock( '../utils/updatedependenciesversions', stubs.updateDependenciesVersions );
			mockery.registerMock( 'parse-github-url', stubs.parseGithubUrl );

			createRelease = require( '../../lib/tasks/createrelease' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'makes a tag and creates a new release on GitHub', () => {
			const options = {
				token: '123',
				init: false,
				dependencies: {
					'@ckeditor/ckeditor5-foo': '1.1.1',
					'@ckeditor/ckeditor5-bar': '2.0.0',
				}
			};

			stubs.tools.shExec.returns( '' );
			stubs.tools.shExec.withArgs( 'npm version minor --no-git-tag-version --force' ).returns( 'v0.6.0' );
			stubs.getNewReleaseType.returns( Promise.resolve( { releaseType: 'minor' } ) );
			stubs.getLastCreatedTag.returns( 'v0.5.0' );
			stubs.utils.getLatestChangesFromChangelog.returns( 'Changes.' );
			stubs.parseGithubUrl.returns( {
				owner: 'organization',
				name: 'repository'
			} );

			sandbox.stub( process, 'cwd' ).returns( '/cwd' );
			sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );

			return createRelease( options )
				.then( () => {
					// All validator methods should be called.
					for ( const item of Object.keys( stubs.validator ) ) {
						expect( stubs.validator[ item ].calledOnce ).to.equal( true );
					}

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getLastCreatedTag.calledOnce ).to.equal( true );

					expect( stubs.updateDependenciesVersions.calledOnce ).to.equal( true );
					expect( stubs.updateDependenciesVersions.firstCall.args[ 0 ] ).to.deep.equal( options.dependencies );
					expect( stubs.updateDependenciesVersions.firstCall.args[ 1 ] ).to.deep.equal( '/cwd/package.json' );

					expect( stubs.utils.getLatestChangesFromChangelog.calledOnce ).to.equal( true );
					expect( stubs.utils.getLatestChangesFromChangelog.firstCall.args[ 0 ] ).to.equal( 'v0.6.0' );
					expect( stubs.utils.getLatestChangesFromChangelog.firstCall.args[ 1 ] ).to.equal( 'v0.5.0' );

					expect( stubs.parseGithubUrl.calledOnce ).to.equal( true );
					expect( stubs.tools.shExec.callCount ).to.equal( 7, 'tools.shExec() calls' );

					expect( stubs.logger.info.callCount ).to.equal( 6, 'logger.info() calls' );
					expect( stubs.logger.info.getCall( 5 ).args[ 0 ] ).to.equal( 'Release "v0.6.0" has been created and published.' );

					expect( stubs.createGithubRelease.calledOnce ).to.equal( true );
					expect( stubs.createGithubRelease.firstCall.args[ 0 ] ).to.equal( '123' );
					expect( stubs.createGithubRelease.firstCall.args[ 1 ] ).to.deep.equal( {
						repositoryOwner: 'organization',
						repositoryName: 'repository',
						version: 'v0.6.0',
						description: 'Changes.'
					} );
				} );
		} );
	} );
} );
