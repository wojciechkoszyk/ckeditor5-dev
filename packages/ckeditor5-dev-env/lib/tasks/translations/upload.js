/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const transifexAPI = require( './transifex-api' );

/**
 * Adds translations to the Transifex.
 *
 * @param {Object} loginConfig
 * @param {String} loginConfig.username Username for the Transifex account.
 * @param {String} loginConfig.password Password for the Transifex account.
 */
module.exports = function upload( loginConfig ) {
	const pathToPoTranslations = path.join( process.cwd(), 'build', '.transifex' );
	const potFiles = fs.readdirSync( pathToPoTranslations ).map( ( packageName ) => ( {
		packageName,
		path: path.join( pathToPoTranslations, packageName, 'en.pot' )
	} ) );

	const resourceExistPromises = potFiles.map( ( potFile ) => {
		return transifexAPI.hasResource( Object.assign( {}, loginConfig, {
			slug: potFile.packageName,
		} ) );
	} );

	return Promise.all( resourceExistPromises ).then( ( resourcesExist ) => {
		return Promise.all( resourcesExist.map( ( resourceExists, index ) => {
			return createOrUpdateResource( loginConfig, potFiles[ index ], resourceExists );
		} ) );
	} )
	.then( () => logger.info( 'All resources uploaded.\n' ) )
	.catch( ( err ) => logger.error( err ) );
};

function createOrUpdateResource( config, potFile, resourceExists ) {
	const { packageName, path } = potFile;
	const resConfig = Object.assign( {}, config, {
		name: packageName,
		slug: packageName,
		content: fs.createReadStream( path )
	} );

	if ( resourceExists ) {
		return transifexAPI.putResourceContent( resConfig )
			.then( ( parsedResponse ) => logPutResponse( packageName, parsedResponse ) );
	}

	return transifexAPI.postResource( resConfig )
		.then( ( parsedResponse ) => logPostResponse( packageName, parsedResponse ) );
}

function logPutResponse( packageName, parsedResponse ) {
	logger.info( `Package: ${ packageName }` );
	// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
	logger.info( `New: ${ parsedResponse.strings_added }` );
	logger.info( `Updated: ${ parsedResponse.strings_updated }` );
	logger.info( `Deleted: ${ parsedResponse.strings_delete }` );
	// jscs:enable requireCamelCaseOrUpperCaseIdentifiers
	process.stdout.write( '\n' );
}

function logPostResponse( packageName, parsedResponse ) {
	logger.info( `Package: ${ packageName }` );
	logger.info( `New: ${ parsedResponse[ 0 ] }` );
	process.stdout.write( '\n' );
}
