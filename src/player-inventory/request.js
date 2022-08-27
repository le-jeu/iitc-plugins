function postAjax(action, data) {
  return new Promise(function (resolve, reject) {
    return window.postAjax(
      action,
      data,
      (ret) => resolve(ret),
      (_, textStatus, errorThrown) => reject(textStatus + ': ' + errorThrown)
    );
  });
}

function getSubscriptionStatus() {
  return postAjax('getHasActiveSubscription');
}

/**
 * @returns {{ result: any[] }}
 */
function getInventory() {
  return postAjax('getInventory', { lastQueryTimestamp: 0 });
}

export function requestInventory() {
  return getSubscriptionStatus()
    .then((data) => {
      if (data.result) return getInventory();
      return Promise.reject('no core');
    })
    .then((data) => data.result);
}
