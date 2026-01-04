/**
 * Allure Decorators and Utilities
 * Easy-to-use decorators for Allure reporting
 */

import { Status, Severity, LinkType } from 'allure-js-commons';
import { allureReporter } from '../services/allure-reporter.service';

/**
 * Decorator to mark a method as an Allure test
 */
export function AllureTest(name?: string, description?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const testName = name || propertyKey;
      const testId = `${target.constructor.name}-${propertyKey}-${Date.now()}`;

      allureReporter.startTest(testId, testName, { description });

      try {
        const result = await originalMethod.apply(this, args);
        allureReporter.endTest(testId, Status.PASSED);
        return result;
      } catch (error: any) {
        allureReporter.endTest(testId, Status.FAILED, {
          message: error.message,
          trace: error.stack,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator to mark a method as an Allure step
 */
export function AllureStep(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const stepName = name || propertyKey;
      allureReporter.startStep(stepName);

      try {
        const result = await originalMethod.apply(this, args);
        allureReporter.endStep(Status.PASSED);
        return result;
      } catch (error: any) {
        allureReporter.endStep(Status.FAILED, {
          message: error.message,
          trace: error.stack,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator to add severity to a test
 */
export function Severity(severity: Severity) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      allureReporter.addLabel('severity', severity);
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to add epic label
 */
export function Epic(epic: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      allureReporter.addLabel('epic', epic);
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to add feature label
 */
export function Feature(feature: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      allureReporter.addLabel('feature', feature);
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to add story label
 */
export function Story(story: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      allureReporter.addLabel('story', story);
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to add tags
 */
export function Tag(...tags: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      tags.forEach(tag => allureReporter.addLabel('tag', tag));
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to add links
 */
export function Link(url: string, name?: string, type: LinkType = LinkType.LINK) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      allureReporter.addLink(url, name, type);
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to add issue link
 */
export function Issue(url: string, name?: string) {
  return Link(url, name, LinkType.ISSUE);
}

/**
 * Decorator to add TMS link
 */
export function TmsLink(url: string, name?: string) {
  return Link(url, name, LinkType.TMS);
}

/**
 * Utility functions for Allure reporting
 */
export const AllureUtils = {
  /**
   * Start a test with metadata
   */
  startTest(testRunId: string, testName: string, metadata?: {
    description?: string;
    severity?: Severity;
    epic?: string;
    feature?: string;
    story?: string;
    tags?: string[];
    parameters?: Record<string, any>;
    links?: Array<{ name: string; url: string; type?: LinkType }>;
  }) {
    return allureReporter.startTest(testRunId, testName, metadata);
  },

  /**
   * End test with status
   */
  endTest(testRunId: string, status: Status, error?: Error) {
    const statusDetails = error ? {
      message: error.message,
      trace: error.stack,
    } : undefined;

    allureReporter.endTest(testRunId, status, statusDetails);
  },

  /**
   * Execute a step
   */
  async step<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    allureReporter.startStep(name);
    
    try {
      const result = await fn();
      allureReporter.endStep(Status.PASSED);
      return result;
    } catch (error: any) {
      allureReporter.endStep(Status.FAILED, {
        message: error.message,
        trace: error.stack,
      });
      throw error;
    }
  },

  /**
   * Add attachment
   */
  attachment(name: string, content: Buffer | string, type: string) {
    allureReporter.addAttachment(name, content, type);
  },

  /**
   * Add screenshot
   */
  screenshot(name: string, path: string) {
    allureReporter.addScreenshot(name, path);
  },

  /**
   * Add video
   */
  video(name: string, path: string) {
    allureReporter.addVideo(name, path);
  },

  /**
   * Add text log
   */
  log(name: string, content: string) {
    allureReporter.addTextAttachment(name, content);
  },

  /**
   * Add JSON data
   */
  json(name: string, data: any) {
    allureReporter.addJsonAttachment(name, data);
  },

  /**
   * Add parameter
   */
  parameter(name: string, value: string) {
    allureReporter.addParameter(name, value);
  },

  /**
   * Add label
   */
  label(name: string, value: string) {
    allureReporter.addLabel(name, value);
  },

  /**
   * Add link
   */
  link(url: string, name?: string, type: LinkType = LinkType.LINK) {
    allureReporter.addLink(url, name, type);
  },

  /**
   * Add issue link
   */
  issue(url: string, name?: string) {
    allureReporter.addLink(url, name, LinkType.ISSUE);
  },

  /**
   * Add TMS link
   */
  tms(url: string, name?: string) {
    allureReporter.addLink(url, name, LinkType.TMS);
  },

  /**
   * Set epic
   */
  epic(epic: string) {
    allureReporter.addLabel('epic', epic);
  },

  /**
   * Set feature
   */
  feature(feature: string) {
    allureReporter.addLabel('feature', feature);
  },

  /**
   * Set story
   */
  story(story: string) {
    allureReporter.addLabel('story', story);
  },

  /**
   * Set severity
   */
  severity(severity: Severity) {
    allureReporter.addLabel('severity', severity);
  },

  /**
   * Add tag
   */
  tag(tag: string) {
    allureReporter.addLabel('tag', tag);
  },

  /**
   * Add multiple tags
   */
  tags(...tags: string[]) {
    tags.forEach(tag => allureReporter.addLabel('tag', tag));
  },

  /**
   * Write environment info
   */
  environment(info: Record<string, string>) {
    allureReporter.writeEnvironmentInfo(info);
  },

  /**
   * Write categories
   */
  categories(categories: Array<{
    name: string;
    matchedStatuses?: Status[];
    messageRegex?: string;
    traceRegex?: string;
  }>) {
    allureReporter.writeCategories(categories);
  },
};

// Export common Allure types
export { Status, Severity, LinkType, Stage } from 'allure-js-commons';
