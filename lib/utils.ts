import {
	aws_lambda as lambda,
	aws_cloudwatch as cw,
	Duration
} from 'aws-cdk-lib'
import { Construct } from 'constructs'


export const buildFunctionAlarm = (scope: Construct, id: string, fn: lambda.IFunction): void => {
	const alarmProps: cw.AlarmProps = {
		alarmName: `alarm-${fn.functionName}-error`,
		alarmDescription: `Severity: ${fn.functionName} Errors out too many times`,
		treatMissingData: cw.TreatMissingData.MISSING,
		metric: fn.metricErrors().with({ period: Duration.minutes(1) }),
		threshold: 0,
		evaluationPeriods: 1,
		comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD,
	}

	new cw.Alarm(scope, id, alarmProps)
}