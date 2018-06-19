const restaurantPromise = idb.open("restaurants", 3, upgradeDb => {
  if (upgradeDb.oldVersion >= 3) return;
  const keyValStore = upgradeDb.createObjectStore("restaurants", {
    keyPath: "id"
  });
});
const reviewsPromise = idb.open("reviews", 3, upgradeDb => {
  if (upgradeDb.oldVersion >= 3) return;
  const keyValStore = upgradeDb.createObjectStore("reviews", {
    keyPath: "id"
  });
});
/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://192.168.0.101:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    restaurantPromise.then(db => {
      const index = db.transaction("restaurants").objectStore("restaurants");
      let served = false;
      index.getAll().then(restaurants => {
        if (restaurants) {
          callback(null, restaurants);
          served = true;
        }
        fetch(`${DBHelper.DATABASE_URL}/restaurants`)
          .then(json => json.json())
          .then(restaurants2 => {
            if (!db) return;

            const tx = db.transaction("restaurants", "readwrite");
            var store = tx.objectStore("restaurants");
            restaurants2.forEach(restaurant => store.put(restaurant));
            if (!served || restaurants.length < restaurants2.length)
              callback(null, restaurants2);
          })
          .catch(err => {
            if (!served) callback(err, null);
          });
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    restaurantPromise.then(restaurantsDb => {
      reviewsPromise.then(reviewsDb => {
        // check if there are reviews for the restaurant
        const reviewsStore = reviewsDb
          .transaction("reviews")
          .objectStore("reviews");
        let reviewsAvailable = false;
        let restaurantReviews = null;
        reviewsStore.getAll().then(reviews => {
          if (reviews) {
            restaurantReviews = reviews.filter(r => r["restaurant_id"] == id);
            if (restaurantReviews.length > 0) {
              // there are cached reviews for the requested restaurant
              reviewsAvailable = true;
            }
          }

          const restaurantsStore = restaurantsDb
            .transaction("restaurants")
            .objectStore("restaurants");
          let served = false;
          let restaurantAvailable = false;
          let restaurant = null;
          // look for cached restaurant
          restaurantsStore.getAll().then(restaurants => {
            if (restaurants) {
              // there are cached restaurants ready to serve
              restaurant = restaurants.find(r => r.id == id);
              if (restaurant) restaurantAvailable = true;
              // both are available in cache
              if (restaurantAvailable && reviewsAvailable) {
                restaurant.reviews = restaurantReviews;
                callback(null, restaurant);
                served = true;
              }
            }
            let fetchedReviews = [];
            let fetchedRestaurant = null;

            // get new reviews for restaurant information
            fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
              .then(json => json.json())
              .then(reviews => {
                // callback when we have restaurant and didn't callback earlier
                if (!served && restaurantAvailable) {
                  restaurant.reviews = reviews;
                  served = true;
                  callback(null, restaurant);
                }
                // update cached reviews DB
                if (reviewsDb) {
                  const reviewsTx = reviewsDb.transaction(
                    "reviews",
                    "readwrite"
                  );
                  const reviewsStore2 = reviewsTx.objectStore("reviews");
                  reviews.forEach(review =>
                    reviewsStore2.put(review, review.id)
                  );
                }
                // get new restaurant information
                fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
                  .then(json => json.json())
                  .then(fetchedRestaurant => {
                    fetchedRestaurant.reviews = fetchedReviews;
                    // callback when not already done
                    if (!served) {
                      callback(null, fetchedRestaurant);
                    }
                    // update cached restaurants db
                    if (!restaurantsDb) return;
                    const restaurantTx = restaurantsDb.transaction(
                      "restaurants",
                      "readwrite"
                    );
                    const restaurantsStore2 = restaurantTx.objectStore(
                      "restaurants"
                    );
                    restaurantsStore2.put(restaurant2);
                  })
                  .catch(() => {
                    if (!served) callback("Restaurant does not exist", null);
                  });
              });
          });
        });
      });
    });
  }

  static favoriteRestaurant(id, newState) {
    return new Promise((resolve, reject) => {
      fetch(`${this.DATABASE_URL}/restaurants/${id}/?is_favorite=${newState}`, {
        method: "PUT",
        headers: {
          accept: "application/json"
        }
      })
        .then(res => res.json())
        .then(json => {
          // update local db
          restaurantPromise.then(restaurantsDb => {
            const tx = restaurantsDb.transaction("restaurants", "readwrite");
            const store = tx.objectStore("restaurants");
            store.put(json);
            resolve(json);
          });
        })
        .catch(err => reject(err));
    });
  }

  static async postReview({ restaurantId, comments, name, ratingNumber }) {
    const data = await fetch(`${this.DATABASE_URL}/reviews/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        rating: ratingNumber,
        comments,
        name
      })
    });
    const json = await data.json();
    const reviewsDb = await reviewsPromise;
    const tx = reviewsDb.transaction("reviews", "readwrite");
    const store = tx.objectStore("reviews");
    store.put(json, json.id);
    // const reviewsStore = reviewsDb
    //   .transaction("reviews")
    //   .objectStore("reviews");
    const allReviews = await store.getAll();
    const reviews = allReviews.filter(r => r["restaurant_id"] == restaurantId);
    return reviews;
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph) {
      return `/img/${restaurant.photograph}.jpg`;
    }
    // fix for missing photograph property, using image 10 as fallback image
    return "/img/10.jpg";
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
