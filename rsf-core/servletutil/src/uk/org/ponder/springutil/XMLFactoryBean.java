/*
 * Created on Nov 23, 2005
 */
package uk.org.ponder.springutil;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.FactoryBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.core.io.Resource;

import uk.org.ponder.conversion.SerializationProvider;
import uk.org.ponder.reflect.ReflectiveCache;
import uk.org.ponder.util.Logger;
import uk.org.ponder.util.UniversalRuntimeException;

/**
 * A very useful base class for any bean constructed out of an XML
 * representation. Will provide a default-constructed object of the required
 * type if the location field is blank or refers to a nonexistent file.
 * 
 * @author Antranig Basman (antranig@caret.cam.ac.uk)
 */

public class XMLFactoryBean implements FactoryBean, ApplicationContextAware {
  String location;
  private ApplicationContext applicationcontext;
  private SerializationProvider xmlprovider;
  private Class objecttype;
  protected ReflectiveCache reflectivecache;

  public void setLocation(String location) {
    this.location = location;
  }

  public void setXMLProvider(SerializationProvider xmlprovider) {
    this.xmlprovider = xmlprovider;
  }

  public void setReflectiveCache(ReflectiveCache reflectivecache) {
    this.reflectivecache = reflectivecache;
  }

  public void setObjectType(Class objecttype) {
    this.objecttype = objecttype;
  }

  public Class getObjectType() {
    return objecttype;
  }

  public Object getObject() throws Exception {
    Object togo = null;
    if (location != null) {
      Resource res = applicationcontext.getResource(location);
      try {
        InputStream is = res.getInputStream();
        togo = xmlprovider.readObject(objecttype, is);
      }
      catch (Exception e) {
        UniversalRuntimeException tothrow = UniversalRuntimeException
            .accumulate(e, "Error loading object from path " + res + ":  ");
        if (tothrow.getTargetException() instanceof IOException) {
          Logger.log.warn(tothrow.getTargetException().getClass().getName()
              + ": " + tothrow.getMessage());
          togo = reflectivecache.construct(objecttype);
        }
        else {
          throw tothrow;
        }
      }
    }
    else {
      togo = reflectivecache.construct(objecttype);
    }
    return togo;
  }

  public boolean isSingleton() {
    return true;
  }

  public void setApplicationContext(ApplicationContext applicationcontext)
      throws BeansException {
    this.applicationcontext = applicationcontext;
  }

}