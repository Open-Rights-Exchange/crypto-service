// Other 'generic' events not in the list
// frontend
// clicked_weblink_${description}
// clicked_${description}

// actions
// chain_action_${chainAction},
// user_action_${userAction}

export enum AnalyticsEvent {
  ApiCalled = 'api_called',
  DecryptingKeyFailedBadPassword = 'decrypting_key_failed_bad_password',
}
