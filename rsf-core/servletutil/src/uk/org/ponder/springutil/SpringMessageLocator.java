/*
 * Created on Nov 23, 2004
 */
package uk.org.ponder.springutil;

import java.text.MessageFormat;
import java.util.Locale;

import org.springframework.context.MessageSource;
import org.springframework.context.support.DefaultMessageSourceResolvable;

import uk.org.ponder.localeutil.LocaleGetter;
import uk.org.ponder.messageutil.MessageLocator;
import uk.org.ponder.util.Logger;

/**
 * An adaptation of the Spring "MessageSource" to the RSF/PUC "MessageLocator"
 * interface. MessageLocator, as well as supplying a greater variety of
 * "utility" methods, returns a default message rather than throwing an exception.
 * 
 * @author Antranig Basman (antranig@caret.cam.ac.uk)
 * 
 */
public class SpringMessageLocator extends MessageLocator {
  private MessageSource messagesource;
  private LocaleGetter localegetter;
  private String defaultmessagekey;
  private String defaultmessage = null;
  // Prior to RSF 0.7.3, default was 
  // "[Message for key {0} not found]";

  public void setMessageSource(MessageSource messagesource) {
    this.messagesource = messagesource;
  }

  public void setLocaleGetter(LocaleGetter localegetter) {
    this.localegetter = localegetter;
  }

  public String getMessage(String[] codes, Object[] args) {
    DefaultMessageSourceResolvable dmsr = new DefaultMessageSourceResolvable(
        codes, args);
    Locale locale = localegetter == null ? Locale.getDefault() : localegetter.get();
    try {
      return messagesource.getMessage(dmsr, locale);
    }
    catch (Exception nsme) {
      Logger.log.warn("Failed to look up message " + codes[0] 
        + " in message bundle " + messagesource + " for locale " + locale);
      try {
        if (defaultmessagekey != null) {
          return messagesource.getMessage(defaultmessagekey, null, locale);
        }
      }
      catch (Exception nsme2) {
      }
    }
    if (defaultmessage != null) {
      MessageFormat mf = new MessageFormat(defaultmessage);
      return mf.format(new Object[] {codes[0]});
    }
    return null;
  }

  /** The ultimate fallback message to be rendered in the case of complete 
   * failure to resolve for a message.
   */
  public void setDefaultMessage(String defaultmessage) {
    this.defaultmessage = defaultmessage;
  }

  /** A message key for a default message, to be tried in the underlying
   * MessageSource *before* finally falling
   * back to defaultMessage.
   */
  public void setDefaultMessageKey(String defaultmessagekey) {
    this.defaultmessagekey = defaultmessagekey;
  }

}
