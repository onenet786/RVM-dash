package com.pleaseisp

import android.accounts.AccountManager
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
    private val RC_ACCOUNT_PICKER = 9002
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
        // Directly launch single native Google account picker so the user only ever sees ONE prompt
        launchAccountPicker(activity)
    }

    private fun launchAccountPicker(activity: Activity) {
        try {
            val intent = AccountManager.newChooseAccountIntent(
                null,
                null,
                arrayOf("com.google"),
                null,
                null,
                null,
                null
            )
            activity.startActivityForResult(intent, RC_ACCOUNT_PICKER)
        } catch (e: Exception) {
            signInPromise?.reject("E_PICKER_FAILED", e.message)
            signInPromise = null
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
                signInPromise = null
            } catch (e: ApiException) {
                if (e.statusCode == 12501 || e.statusCode == 12502) {
                    // User pressed back / cancelled
                    signInPromise?.reject("E_CANCELLED", "User cancelled account selection")
                    signInPromise = null
                } else if (e.statusCode == 10 || e.statusCode == 7 || e.statusCode == 8) {
                    // Code 10 is DEVELOPER_ERROR (SHA-1 fingerprint not yet registered in Google Console)
                    // Automatically fallback to native Android Account Picker without error
                    launchAccountPicker(activity)
                } else {
                    // Fallback to native Account Picker
                    launchAccountPicker(activity)
                }
            } catch (e: Exception) {
                launchAccountPicker(activity)
            }
        } else if (requestCode == RC_ACCOUNT_PICKER) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                val accountName = data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME)
                if (accountName != null && accountName.isNotEmpty()) {
                    val map = Arguments.createMap()
                    map.putString("email", accountName)
                    map.putString("name", accountName.split("@")[0])
                    map.putString("id", accountName)
                    map.putString("photoUrl", "")
                    map.putString("idToken", "")
                    signInPromise?.resolve(map)
                } else {
                    signInPromise?.reject("E_NO_ACCOUNT", "No account selected")
                }
            } else {
                signInPromise?.reject("E_CANCELLED", "User cancelled account selection")
            }
            signInPromise = null
        }
    }

    override fun onNewIntent(intent: Intent) {}
}
