import Mixin from '@ember/object/mixin';

import { inject } from '@ember/service';

/**
 * Ember Mixin that can be combined with an ember-data adapter. It is intended to..
 * (i) check that the keycloak session is fresh immediately before a call to the secured back end, and
 * (ii) add an Authorization header into any calls made via the adapter to the secured back end.
 * If the session check fails this mixin will throw an error - it will not redirect the user to the login page.
 */
export default Mixin.create({

  session: inject('keycloak-session'),

  get headers() {
    let session = this.get('session');
    let keycloak = session.get('keycloak');

    return {
      'Authorization': `Bearer ${keycloak['token']}`
    };
  },

  /**
   * Will overload the adapter method to ensure that the call to the secured back end is made only after the session token has been updated.
   * @param url
   * @param type
   * @param hash
   */
  ajax(url, type, hash) {

    let self = this;
    let ajax = this._super;

    let session = this.get('session');

    return session.updateToken().then(
      () =>
        /**
         * We have a valid token - call the super method
         */
        ajax.apply(self, [url, type, hash]),

      reason => {
        console.warn(`Keycloak adapter mixin :: ajax :: rejected :: ${reason}`);
        throw reason;
      });
  },

});
