import React from 'react'
import Counter from '../counter/container'

export default () => {
	return (
		<div>
			<Counter localKey='first' />
			<Counter localKey='second' />
		</div>
	)
}