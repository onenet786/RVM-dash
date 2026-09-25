package com.pleaseisp

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

class GoogleAuthModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private val RC_SIGN_IN = 9001
    private var signInPromise: Promise? = null
    private var googleSignInClient: GoogleSignInClient? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "GoogleAuth"

    @ReactMethod
    fun signIn(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity does not exist")
            return
        }

        signInPromise = promise

        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestProfile()
            .build()

        googleSignInClient = GoogleSignIn.getClient(activity, gso)

        // Clear any previous sign-in cache so the native account picker always shows
        googleSignInClient?.signOut()?.addOnCompleteListener {
            try {
                val signInIntent = googleSignInClient!!.signInIntent
                activity.startActivityForResult(signInIntent, RC_SIGN_IN)
            } catch (e: Exception) {
                signInPromise?.reject("E_INTENT_FAILED", e.message)
                signInPromise = null
            }
        }
    }

    @ReactMethod
    fun signOut(promise: Promise) {
        val activity = currentActivity
        if (activity != null && googleSignInClient != null) {
            googleSignInClient?.signOut()?.addOnCompleteListener {
                promise.resolve(true)
            }
        } else {
            promise.resolve(true)
        }
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == RC_SIGN_IN) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            try {
                val account: GoogleSignInAccount = task.getResult(ApiException::class.java)
                val map = Arguments.createMap()
                map.putString("email", account.email ?: "")
                map.putString("name", account.displayName ?: (account.email?.split("@")?.get(0) ?: ""))
                map.putString("id", account.id ?: "")
                map.putString("photoUrl", account.photoUrl?.toString() ?: "")
                map.putString("idToken", account.idToken ?: "")
                signInPromise?.resolve(map)
            } catch (e: ApiException) {
                if (e.statusCode == 12501 || e.statusCode == 12502) {
                    signInPromise?.reject("E_CANCELLED", "User cancelled account selection")
                } else {
                    signInPromise?.reject("E_SIGN_IN_FAILED", "Google sign-in error code: ${e.statusCode}")
                }
            } catch (e: Exception) {
                signInPromise?.reject("E_UNKNOWN", e.message)
            } finally {
                signInPromise = null
            }
        }
    }

    override fun onNewIntent(intent: Intent) {}
}
