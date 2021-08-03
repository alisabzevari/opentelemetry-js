/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { TracerProvider } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/api-metrics';
import { Instrumentation } from './types';
import { AutoLoaderResult, InstrumentationOption } from './types_internal';
import { InstrumentationBase } from './platform';

/**
 * Parses the options and returns instrumentations, node plugins and
 *   web plugins
 * @param options
 */
export function parseInstrumentationOptions(
  options: InstrumentationOption[] = []
): AutoLoaderResult {
  let instrumentations: Instrumentation[] = [];
  for (let i = 0, j = options.length; i < j; i++) {
    const option = options[i];
    if (Array.isArray(option)) {
      const results = parseInstrumentationOptions(option);
      instrumentations = instrumentations.concat(results.instrumentations);
    } else if (isInstrumentationClass(option)) {
      instrumentations.push(new option());
    } else if (isInstrumentation(option)) {
      instrumentations.push(option);
    }
  }

  return { instrumentations };
}

function isInstrumentationClass<T extends InstrumentationBase>(option: InstrumentationOption): option is new () => T {
  return typeof option === 'function';
}

function isInstrumentation(option: InstrumentationOption): option is Instrumentation {
  return Boolean((option as Instrumentation).instrumentationName);
}

/**
 * Enable instrumentations
 * @param instrumentations
 * @param tracerProvider
 * @param meterProvider
 */
export function enableInstrumentations(
  instrumentations: Instrumentation[],
  tracerProvider?: TracerProvider,
  meterProvider?: MeterProvider
): void {
  for (let i = 0, j = instrumentations.length; i < j; i++) {
    const instrumentation = instrumentations[i];
    if (tracerProvider) {
      instrumentation.setTracerProvider(tracerProvider);
    }
    if (meterProvider) {
      instrumentation.setMeterProvider(meterProvider);
    }
    // instrumentations have been already enabled during creation
    // so enable only if user prevented that by setting enabled to false
    // this is to prevent double enabling but when calling register all
    // instrumentations should be now enabled
    if (!instrumentation.getConfig().enabled) {
      instrumentation.enable();
    }
  }
}

/**
 * Disable instrumentations
 * @param instrumentations
 */
export function disableInstrumentations(instrumentations: Instrumentation[]): void {
  instrumentations.forEach(instrumentation => instrumentation.disable());
}
